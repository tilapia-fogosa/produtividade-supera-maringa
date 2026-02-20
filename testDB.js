import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    "https://hkvjdxxndapxpslovrlc.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdmpkeHhuZGFweHBzbG92cmxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY3MDE3NywiZXhwIjoyMDU0MjQ2MTc3fQ.YSdlgfjFm2Me0oCDzlXRMfxgFHipuLKLdzJYuMMEd5Q"
)

async function testConnection() {
    console.log("Teste de conexão executando...")

    const { data: clientsData, error: clientsErr } = await supabase
        .from('clients')
        .select('id')
        .limit(1)

    if (clientsErr) {
        console.error("Erro na tabela clients:", clientsErr)
    } else {
        console.log("Tabela clients OK, encontrou:", clientsData?.length, "registros")
    }

    const { data: summaryData, error: summaryErr } = await supabase
        .from('kanban_client_summary')
        .select('id')
        .limit(1)

    if (summaryErr) {
        console.error("Erro na view kanban_client_summary:", summaryErr)
    } else {
        console.log("View kanban_client_summary OK, encontrou:", summaryData?.length, "registros")
    }
}

testConnection()
