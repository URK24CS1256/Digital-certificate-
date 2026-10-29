import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export default async function generateCertificatePDF(certificate) {
  const verificationUrl = `${window.location.origin}/verify?id=${encodeURIComponent(
    certificate.certificateId
  )}`;

  const qrCode = await QRCode.toDataURL(verificationUrl, {
    width: 300,
    margin: 1,
    errorCorrectionLevel: "H",
  });

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = 297;
  const height = 210;
  const blue = [37, 99, 235];
  const navy = [15, 23, 42];
  const grey = [100, 116, 139];

  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, width, height, "F");

  // Minimal border
  pdf.setDrawColor(210, 225, 250);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(9, 9, width - 18, height - 18, 3, 3);

  // Cerver branding
  pdf.setTextColor(...blue);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(23);
  pdf.text("Cerver", 20, 27);

  pdf.setTextColor(...grey);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("CERTIFY  |  VERIFY  |  EMPOWER", 20, 34);

  // Accent line
  pdf.setFillColor(...blue);
  pdf.roundedRect(20, 43, 16, 1.5, 0.5, 0.5, "F");

  // Certificate heading
  pdf.setTextColor(...navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text("CERTIFICATE OF COMPLETION", 20, 57);

  pdf.setTextColor(...grey);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("THIS CERTIFIES THAT", 20, 72);

  // Recipient name
  const recipientName = certificate.recipientName || "Recipient";
  let recipientFontSize = 30;

  pdf.setFont("helvetica", "bold");
  while (
    recipientFontSize > 18 &&
    pdf.getTextWidth(recipientName) > 185
  ) {
    recipientFontSize -= 1;
  }

  pdf.setFontSize(recipientFontSize);
  pdf.setTextColor(...navy);
  pdf.text(recipientName, 20, 88);

  // Divider
  pdf.setDrawColor(210, 225, 250);
  pdf.line(20, 94, 100, 94);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(...grey);
  pdf.text("has successfully completed the program", 20, 104);

  // Course name
  const course = certificate.course || "Course";
  let courseFontSize = 19;

  pdf.setFont("helvetica", "bold");
  while (
    courseFontSize > 12 &&
    pdf.getTextWidth(course) > 175
  ) {
    courseFontSize -= 1;
  }

  pdf.setFontSize(courseFontSize);
  pdf.setTextColor(...blue);
  pdf.text(course, 20, 117);

  // Description
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...grey);

  const description =
    "Awarded in recognition of dedication, hard work, and successful completion of the program.";

  const descriptionLines = pdf.splitTextToSize(description, 175);
  pdf.text(descriptionLines, 20, 127);

  // Right-side details divider
  pdf.setDrawColor(220, 228, 240);
  pdf.line(210, 43, 210, 170);

  // Certificate ID
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text("CERTIFICATE ID", 220, 51);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...navy);

  const certificateId = certificate.certificateId || "N/A";
  const idLines = pdf.splitTextToSize(certificateId, 57);
  pdf.text(idLines, 220, 60);

  // Issue date
  const issueDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "N/A";

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text("ISSUE DATE", 220, 75);

  pdf.setFontSize(11);
  pdf.setTextColor(...navy);
  pdf.text(issueDate, 220, 84);

  // Issuer
  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text("ISSUED BY", 220, 98);

  pdf.setFontSize(10);
  pdf.setTextColor(...navy);
  const issuer = pdf.splitTextToSize(
    certificate.issuer || "Cerver",
    57
  );
  pdf.text(issuer, 220, 106);

  // QR verification code
  pdf.addImage(qrCode, "PNG", 220, 124, 27, 27);

  pdf.setFontSize(8);
  pdf.setTextColor(...blue);
  pdf.text("SCAN TO VERIFY", 251, 135);

  pdf.setFontSize(7);
  pdf.setTextColor(...grey);
  pdf.text("Verify authenticity", 251, 141);
  pdf.text("on Cerver", 251, 146);

  // Signature areas
  pdf.setDrawColor(148, 163, 184);
  pdf.line(25, 169, 88, 169);
  pdf.line(112, 169, 175, 169);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...navy);
  pdf.text("Authorized Signatory", 25, 176);
  pdf.text("Institution Representative", 112, 176);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text(certificate.issuer || "Cerver", 25, 182);
  pdf.text("Cerver", 112, 182);

  // Footer
  pdf.setDrawColor(220, 228, 240);
  pdf.line(20, 190, 277, 190);

  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text("Cerver  |  Skills for a brighter tomorrow", 20, 197);
  pdf.text(`Certificate ID: ${certificateId}`, 277, 197, {
    align: "right",
  });

  // Download PDF
  const safeName = recipientName.replace(/[^a-z0-9_-]/gi, "_");
  pdf.save(`Cerver_Certificate_${safeName}.pdf`);
}
