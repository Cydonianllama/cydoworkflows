export function otpEmailTemplate(code: string): string {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px">
    <h1 style="font-size:20px;margin:0 0 8px">Verifica tu email</h1>
    <p style="color:#475569;margin:0 0 24px">Usa este código para confirmar tu cuenta en Cydo.</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 0;text-align:center;background:#f1f5f9;border-radius:12px">${code}</div>
    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0">El código expira en 10 minutos. Si no fuiste tú, ignora este mensaje.</p>
  </div>`
}

export function inviteEmailTemplate(inviterName: string, acceptUrl: string): string {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px">
    <h1 style="font-size:20px;margin:0 0 8px">Te invitaron a Cydo</h1>
    <p style="color:#475569;margin:0 0 24px"><strong>${inviterName}</strong> te invitó a colaborar en su cuenta de workflows.</p>
    <a href="${acceptUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px">Aceptar invitación</a>
    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0">Si no esperabas esta invitación, ignora este mensaje.</p>
  </div>`
}
