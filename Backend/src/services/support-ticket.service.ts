import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { WhatsAppService } from "./whatsapp.service";

export interface CreateTicketParams {
  phoneNumber: string;
  whatsappId?: string;
  customerName?: string;
  subject: string;
  issueCategory: string;
  message: string;
  transactionRef?: string;
}

export class SupportTicketService {
  /**
   * Create or append to a customer support ticket from WhatsApp
   */
  static async handleInboundSupportMessage(params: CreateTicketParams): Promise<{
    ticketNumber: string;
    isNew: boolean;
  }> {
    const phone = params.phoneNumber.startsWith("+")
      ? params.phoneNumber
      : `+${params.phoneNumber}`;

    // Find user record if registered
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber: phone }, { whatsappId: params.whatsappId || phone }],
      },
    });

    // Check for existing OPEN or IN_PROGRESS ticket within last 24h
    const existing = await prisma.supportTicket.findFirst({
      where: {
        phoneNumber: phone,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.supportTicket.update({
          where: { id: existing.id },
          data: {
            lastMessage: params.message,
            updatedAt: new Date(),
          },
        }),
        prisma.supportTicketMessage.create({
          data: {
            ticketId: existing.id,
            sender: "CUSTOMER",
            message: params.message,
          },
        }),
      ]);

      return { ticketNumber: existing.ticketNumber, isNew: false };
    }

    // Generate new unique ticket number (e.g. VODE-TKT-10492)
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const ticketNumber = `VODE-TKT-${randomDigits}`;

    await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: user?.id || null,
        phoneNumber: phone,
        customerName: params.customerName || user?.fullName || "WhatsApp Customer",
        subject: params.subject,
        issueCategory: params.issueCategory,
        lastMessage: params.message,
        transactionRef: params.transactionRef || null,
        messages: {
          create: {
            sender: "CUSTOMER",
            message: params.message,
          },
        },
      },
    });

    logger.info({ ticketNumber, phone }, "🎟️ Created new customer support ticket");
    return { ticketNumber, isNew: true };
  }

  /**
   * Admin sends a reply message to the customer via WhatsApp
   */
  static async sendAdminReply(
    ticketId: string,
    adminId: string,
    replyMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    // Save message to ticket transcript
    await prisma.$transaction([
      prisma.supportTicketMessage.create({
        data: {
          ticketId,
          sender: "ADMIN",
          senderId: adminId,
          message: replyMessage,
        },
      }),
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: "IN_PROGRESS",
          assignedAdminId: adminId,
          lastMessage: replyMessage,
          updatedAt: new Date(),
        },
      }),
    ]);

    // Send formatted WhatsApp message to user
    const recipientPhone = ticket.phoneNumber.replace("+", "");
    const formatted = `💬 *Vode Support Response* (Ref: \`${ticket.ticketNumber}\`)\n\n${replyMessage}\n\n_Reply directly to this chat if you need further help._`;

    await WhatsAppService.sendTextMessage(recipientPhone, formatted).catch((err) => {
      logger.error({ error: err.message, ticketId }, "Failed to deliver WhatsApp support reply");
    });

    return { success: true };
  }
}

