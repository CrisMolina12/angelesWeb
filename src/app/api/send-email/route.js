import { Resend } from 'resend';

// Inicializa Resend con tu clave de API
const resend = new Resend('re_QgFM1Ckg_NFjofpSa8ghyixjWC59W4zbW');

export async function POST(request) {
  // Obtiene los datos de la solicitud
  const { email, accessToken, refreshToken } = await request.json();

  console.log('Enviando correo a:', email);
  console.log('Access Token:', accessToken);
  console.log('Refresh Token:', refreshToken);

  try {
    // Envía el correo
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Cambia esto a tu correo
      to: email,
      subject: 'Recuperación de contraseña',
      text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: ${process.env.NEXT_PUBLIC_APP_URL}/reset#access_token=${accessToken}&refresh_token=${refreshToken}`,
    });

    // Responde con un mensaje de éxito
    return new Response('Correo enviado', { status: 200 });
  } catch (error) {
    // Manejo de errores
    console.error('Error al enviar el correo:', error);
    return new Response('Error al enviar el correo', { status: 500 });
  }
}
