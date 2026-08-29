import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resendKey = Deno.env.get('RESEND_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  try {
    const hoje = new Date();
    const diaDaSemana = hoje.getDay(); // Pega o dia de hoje (0 = Dom, 3 = Qua, 4 = Qui)
    const diasParaSexta = 5 - diaDaSemana; 
    
    const proximaSexta = new Date(hoje);
    proximaSexta.setDate(hoje.getDate() + diasParaSexta);
    
    // Formata a data para o padrão DD/MM/YYYY
    const dia = String(proximaSexta.getDate()).padStart(2, '0');
    const mes = String(proximaSexta.getMonth() + 1).padStart(2, '0');
    const ano = proximaSexta.getFullYear();
    const dataBusca = `${dia}/${mes}/${ano}`; 
    
    const { data: atividades, error } = await supabase
      .from('circuits')
      .select('*')
      .eq('activity_date', dataBusca);

    if (error) throw error;

    if (!atividades || atividades.length === 0) {
      return new Response(`Nenhuma atividade encontrada para ${dataBusca}. E-mail não enviado.`, { status: 200 });
    }

    let assunto = "";
    let corpo = "";

    // SE HOJE FOR QUINTA-FEIRA (Dia 4), MUDA A MENSAGEM:
    if (diaDaSemana === 4) {
      assunto = `ATIVIDOSO | 🚨 AVISO GERAL: Amanhã tem atividade! (${dataBusca})`;
      corpo = `Olá a todos!<br><br>Passando para lembrar que <strong>AMANHÃ é dia de ATIVIDOSO!</strong><br>Independente de qual seja o tema da semana, contamos com todos prontos para mais um dia de projeto.<br><br>Para reforçar, seguem os responsáveis de amanhã:<br><br>`;
    } else {
      // SE FOR DOMINGO (0) OU QUARTA (3), MENSAGEM NORMAL DE PLANEJAMENTO:
      assunto = `ATIVIDOSO | Organização para Sexta-feira (${dataBusca})`;
      corpo = `Olá, equipe!<br><br>Lembrete automático para a nossa atividade desta sexta-feira. Planejem-se e organizem os materiais:<br><br>`;
    }
    
    // Adiciona o tema e os responsáveis no final do e-mail (serve para os dois textos)
    atividades.forEach(ativ => {
      corpo += `<strong>Tema: ${ativ.name}</strong><br>👥 Equipe Responsável: ${ativ.responsibles}<br><br>`;
    });

    // Dispara o e-mail via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Atividoso <onboarding@resend.dev>',
        to: 'henrillefernando@gmail.com', // COLOQUE SEU E-MAIL AQUI
        subject: assunto,
        html: `<p>${corpo}</p>`
      })
    });

    const dataResend = await res.json();
    return new Response(JSON.stringify(dataResend), { headers: { "Content-Type": "application/json" } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})