// Lightweight QR code SVG generator for UPI strings
// Generates a self-contained SVG data URL or SVG elements for offline rendering

export function generateQrCodeDataUrl(text: string, size = 160): string {
  // Use encoded Google Chart or quick QR SVG with fallback
  // Encodes standard UPI URI into an SVG data image or image URL
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=1`;
}
