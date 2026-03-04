// /api/send-alerts.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// 🔹 Inicializa Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // precisa ser a service role p/ ler sem restrição de RLS
);

// 🔹 Inicializa Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Função Serverless da Vercel
export default async function handler(req, res) {
  try {
    // 1. Buscar registros dos próximos 3 dias
    const { data, error } = await supabase
      .from("cronograma_retiradas")
      .select("id, codigo_versao, data_programada")
      .gte("data_programada", new Date().toISOString()) // >= hoje
      .lte("data_programada", new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()); // <= hoje + 3 dias

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(200).json({ message: "Nenhuma amostra próxima do vencimento." });
    }

    // 2. Montar corpo do e-mail (HTML simples)
    const htmlBody = `
      <h2>Amostras próximas do vencimento (3 dias)</h2>
      <ul>
        ${data
          .map(
            (item) =>
              `<li><strong>${item.codigo_versao}</strong> - vence em: ${new Date(
                item.data_programada
              ).toLocaleDateString("pt-BR")}</li>`
          )
          .join("")}
      </ul>
      <br />
      <br />
      <p>
      Link do sistema: 
      <a href="https://qas.easyestabilidade.com.br" target="_blank">
      https://qas.easyestabilidade.com.br
      </a>
      </p>
  
      <br />
      <p>Atenciosamente,<br/>EasyEstabilidade.</p>
    `;

    // 3. Enviar e-mail
    await resend.emails.send({
      from: "info@easyestabilidade.com.br", // precisa estar validado no Resend
      to: ["leonamloureiro1@gmail.com", "robson.com@gmail.com", "info@easyestabilidade.com.br"], // lista de destinatários
      subject: "⚠️ Amostras próximas do vencimento",
      html: htmlBody,
    });

    return res.status(200).json({ message: "Email enviado com sucesso!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
