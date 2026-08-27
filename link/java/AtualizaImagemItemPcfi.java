package br.com.sankhya.pcfi;

import br.com.sankhya.extensions.eventoprogramavel.EventoProgramavelJava;
import br.com.sankhya.jape.event.PersistenceEvent;
import br.com.sankhya.jape.event.TransactionContext;
import br.com.sankhya.jape.vo.DynamicVO;
import br.com.sankhya.jape.wrapper.JapeFactory;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Evento Após Inserir/Alterar da entidade AnexoSistema (TSIANX). */
public class AtualizaImagemItemPcfi implements EventoProgramavelJava {
    private static final String INSTANCIA = "AD_PCFIITE";
    private static final Pattern PK_ITEM = Pattern.compile("^(\\d+)_(\\d+)_AD_PCFIITE$");

    @Override public void afterInsert(PersistenceEvent event) throws Exception { processarAnexo(event); }
    @Override public void afterUpdate(PersistenceEvent event) throws Exception { processarAnexo(event); }

    private void processarAnexo(PersistenceEvent event) throws Exception {
        DynamicVO anexo = (DynamicVO) event.getVo();
        if (!INSTANCIA.equals(anexo.asString("NOMEINSTANCIA"))) return;
        Matcher matcher = PK_ITEM.matcher(anexo.asString("PKREGISTRO"));
        if (!matcher.matches()) return;

        String chaveArquivo = anexo.asString("CHAVEARQUIVO");
        if (chaveArquivo == null || chaveArquivo.trim().isEmpty()) return;

        DynamicVO parametro = JapeFactory.dao("ParametroSistema")
                .findOne("CHAVE = 'FREPBASEFOLDER'");
        if (parametro == null) throw new IllegalStateException("Parâmetro FREPBASEFOLDER não encontrado.");
        String diretorioBase = parametro.asString("TEXTO");
        if (diretorioBase == null || diretorioBase.trim().isEmpty()) {
            throw new IllegalStateException("Parâmetro FREPBASEFOLDER não configurado.");
        }

        Path diretorioAnexos = Paths.get(diretorioBase, "Sistema", "Anexos", INSTANCIA)
                .toAbsolutePath().normalize();
        Path arquivo = diretorioAnexos.resolve(chaveArquivo).normalize();
        if (!arquivo.startsWith(diretorioAnexos) || !Files.isRegularFile(arquivo)) return;

        BigDecimal nupcfi = new BigDecimal(matcher.group(1));
        BigDecimal sequencia = new BigDecimal(matcher.group(2));
        byte[] imagem = Files.readAllBytes(arquivo);
        DynamicVO item = JapeFactory.dao(INSTANCIA).findOne(
                "NUPCFI = ? AND SEQUENCIA = ?", new Object[]{nupcfi, sequencia});
        if (item == null) throw new IllegalStateException("Item AD_PCFIITE não encontrado para o anexo.");
        JapeFactory.dao(INSTANCIA).prepareToUpdate(item).set("IMAGEM", imagem).update();
    }

    @Override public void beforeInsert(PersistenceEvent event) throws Exception { }
    @Override public void beforeUpdate(PersistenceEvent event) throws Exception { }
    @Override public void beforeDelete(PersistenceEvent event) throws Exception { }
    @Override public void afterDelete(PersistenceEvent event) throws Exception { }
    @Override public void beforeCommit(TransactionContext context) throws Exception { }
}
