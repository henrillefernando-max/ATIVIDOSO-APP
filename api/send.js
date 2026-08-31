export default async function handler(req, res) {
  // Garante que só aceita pedidos POST (o envio de formulário)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, subject, html } = req.body;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ATIVIDOSO <onboarding@resend.dev>', // Corrigido!
        to: [to],
        subject: subject,
        html: html
      })
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
}