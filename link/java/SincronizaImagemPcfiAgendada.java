package AcoesAgendadas.PCFI;

import br.com.sankhya.jape.vo.DynamicVO;
import br.com.sankhya.jape.wrapper.JapeFactory;
import br.com.sankhya.jape.wrapper.JapeWrapper;
import org.cuckoo.core.ScheduledAction;
import org.cuckoo.core.ScheduledActionContext;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collection;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SincronizaImagemPcfiAgendada implements ScheduledAction {
    private static final String INSTANCIA = "AD_PCFIITE";
    private static final int LIMITE_POR_EXECUCAO = 50;
    private static final Pattern PK_ITEM = Pattern.compile("^(\\d+)_(\\d+)_AD_PCFIITE$");

    @Override public void onTime(ScheduledActionContext context) {
        int processadas = 0, pendentes = 0, falhas = 0;
        try {
            JapeWrapper anexosDao = JapeFactory.dao("AnexoSistema");
            JapeWrapper itensDao = JapeFactory.dao(INSTANCIA);
            DynamicVO parametro = JapeFactory.dao("ParametroSistema").findOne("CHAVE = 'FREPBASEFOLDER'");
            if (parametro == null) throw new IllegalStateException("Parâmetro FREPBASEFOLDER não encontrado.");
            Path diretorio = Paths.get(parametro.asString("TEXTO"), "Sistema", "Anexos", INSTANCIA).toAbsolutePath().normalize();
            Collection<DynamicVO> anexos = anexosDao.find("NOMEINSTANCIA = 'AD_PCFIITE' AND DESCRICAO = 'Foto PCFI' AND CHAVEARQUIVO IS NOT NULL");
            for (DynamicVO anexo : anexos) {
                if (processadas + pendentes + falhas >= LIMITE_POR_EXECUCAO) break;
                try {
                    Matcher m = PK_ITEM.matcher(anexo.asString("PKREGISTRO"));
                    if (!m.matches()) continue;
                    DynamicVO item = itensDao.findOne("NUPCFI = ? AND SEQUENCIA = ?", new Object[]{new BigDecimal(m.group(1)), new BigDecimal(m.group(2))});
                    if (item == null || item.asBlob("IMAGEM") != null) continue;
                    Path arquivo = diretorio.resolve(anexo.asString("CHAVEARQUIVO")).normalize();
                    if (!arquivo.startsWith(diretorio) || !Files.isRegularFile(arquivo)) { pendentes++; continue; }
                    itensDao.prepareToUpdate(item).set("IMAGEM", Files.readAllBytes(arquivo)).update();
                    processadas++;
                } catch (Exception e) { falhas++; System.err.println("Erro ao sincronizar imagem PCFI: " + e.getMessage()); }
            }
            System.out.println("Ação PCFI finalizada. Processadas: " + processadas + ", pendentes: " + pendentes + ", falhas: " + falhas + ".");
        } catch (Exception e) { System.err.println("Erro na ação agendada de imagens PCFI: " + e.getMessage()); throw new RuntimeException(e); }
    }
}
