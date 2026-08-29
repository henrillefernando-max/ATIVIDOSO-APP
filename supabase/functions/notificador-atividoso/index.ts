import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const resendKey = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  console.log("1. Gatilho acionado! Função começou a rodar.");
  
  if (!resendKey) {
     console.log("ERRO FATAL: A chave do Resend não foi encontrada no Supabase.");
  }

  try {
    const payload = await req.json();
    console.log(`2. Tipo do evento: ${payload.type} | Tabela: ${payload.table}`);
    
    if (payload.type === 'INSERT' && payload.table === 'announcements') {
      const aviso = payload.record;
      const assunto = `ATIVIDOSO | Novo Aviso: ${aviso.title}`;
      const corpo = `Um novo aviso foi postado no mural:<br><br><strong>${aviso.title}</strong><br>${aviso.content}`;

      console.log(`3. Montando e-mail para o aviso: "${aviso.title}". Enviando para o Resend...`);
      
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Atividoso <onboarding@resend.dev>',
          to: 'henrillefernando@gmail.com', // PREENCHA COM O SEU E-MAIL CADASTRADO NO RESEND
          subject: assunto,
          html: `<p>${corpo}</p>`
        })
      });

      const data = await res.json();
      console.log("4. RESPOSTA DO RESEND:", data); // É AQUI QUE ELE VAI ENTREGAR O PROBLEMA!
      
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ message: "Ignorado" }), { status: 200 })

  } catch (error) {
    console.log("ERRO NO CÓDIGO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})