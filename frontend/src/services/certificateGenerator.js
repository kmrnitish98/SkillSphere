import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * generateCertificatePDF
 * Creates and downloads a premium certificate PDF using jsPDF.
 *
 * @param {Object} opts
 * @param {string} opts.studentName
 * @param {string} opts.courseName
 * @param {string} opts.certificateId
 * @param {number} opts.percentage
 * @param {string} opts.issuedAt  – ISO date string
 */
export const generateCertificatePDF = async ({
  studentName,
  courseName,
  certificateId,
  percentage,
  issuedAt,
}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const W = 297; // A4 landscape width
  const H = 210; // A4 landscape height

  // ── Background ────────────────────────────────────────────────────────────
  // Deep navy background
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, W, H, 'F');

  // Gold top border bar
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, W, 6, 'F');
  doc.rect(0, H - 6, W, 6, 'F');

  // Left accent bar
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, 6, H, 'F');
  doc.rect(W - 6, 0, 6, H, 'F');

  // Subtle inner frame
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, W - 28, H - 28);

  // Corner ornaments (simple diamonds)
  const drawDiamond = (cx, cy, r) => {
    doc.setFillColor(212, 175, 55);
    doc.setDrawColor(212, 175, 55);
    doc.lines([[r, r], [r, -r], [-r, -r], [-r, r]], cx - r, cy, [1, 1], 'FD', true);
  };
  [[18, 18], [W - 18, 18], [18, H - 18], [W - 18, H - 18]].forEach(([x, y]) =>
    drawDiamond(x, y, 3)
  );

  // ── Logo Area ─────────────────────────────────────────────────────────────
  doc.setFillColor(34, 197, 94);
  doc.roundedRect(20, 20, 26, 26, 4, 4, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SS', 33, 36, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('SkillSphere', 49, 30);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('Learning Management System', 49, 36);

  // ── Main Heading ──────────────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.text('C E R T I F I C A T E   O F   C O M P L E T I O N', W / 2, 40, { align: 'center' });

  // Divider
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(50, 44, W - 50, 44);

  // "This is to certify that"
  doc.setFontSize(11);
  doc.setTextColor(180, 180, 200);
  doc.setFont('helvetica', 'italic');
  doc.text('This is to proudly certify that', W / 2, 60, { align: 'center' });

  // ── Student Name ──────────────────────────────────────────────────────────
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(studentName, W / 2, 82, { align: 'center' });

  // Name underline
  const nameWidth = doc.getTextWidth(studentName);
  const nameX = W / 2 - nameWidth / 2;
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(1);
  doc.line(nameX, 85, nameX + nameWidth, 85);

  // "has successfully completed"
  doc.setFontSize(11);
  doc.setTextColor(180, 180, 200);
  doc.setFont('helvetica', 'italic');
  doc.text('has successfully completed the course', W / 2, 97, { align: 'center' });

  // ── Course Name ───────────────────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  // Truncate if too long
  const maxCourseChars = 55;
  const displayCourse = courseName.length > maxCourseChars
    ? courseName.substring(0, maxCourseChars) + '…'
    : courseName;
  doc.text(displayCourse, W / 2, 111, { align: 'center' });

  // ── Score Badge ───────────────────────────────────────────────────────────
  doc.setFillColor(34, 197, 94, 0.15);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.roundedRect(W / 2 - 30, 118, 60, 12, 3, 3, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.text(`Final Score: ${percentage}%`, W / 2, 126, { align: 'center' });

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(50, 140, W - 50, 140);

  // ── Footer Row ────────────────────────────────────────────────────────────
  const issueDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Issue date
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 170);
  doc.setFont('helvetica', 'normal');
  doc.text('DATE OF ISSUE', 55, 152);
  doc.setFontSize(10);
  doc.setTextColor(220, 220, 240);
  doc.setFont('helvetica', 'bold');
  doc.text(issueDate, 55, 159);

  // Certificate ID
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 170);
  doc.setFont('helvetica', 'normal');
  doc.text('CERTIFICATE ID', W / 2, 152, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(certificateId, W / 2, 159, { align: 'center' });

  // Signature line
  doc.setDrawColor(100, 100, 130);
  doc.setLineWidth(0.3);
  doc.line(W - 90, 162, W - 30, 162);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 170);
  doc.setFont('helvetica', 'italic');
  doc.text('Authorized by SkillSphere', W - 60, 168, { align: 'center' });

  // ── QR Code ───────────────────────────────────────────────────────────────
  try {
    const verifyUrl = `${window.location.origin}/verify/${certificateId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#D4AF37', light: '#0A0F1E' },
    });
    doc.addImage(qrDataUrl, 'PNG', W - 52, 143, 22, 22);
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 140);
    doc.text('Scan to verify', W - 41, 168, { align: 'center' });
  } catch (_) {
    // QR generation failed – skip silently
  }

  // ── Download ──────────────────────────────────────────────────────────────
  doc.save(`SkillSphere-Certificate-${certificateId}.pdf`);
};
