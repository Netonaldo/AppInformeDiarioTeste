import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

type BaseRow = Record<string, string>;

type InformeData = {
  data: string;
  turno: string;
  produto: string;
  quantidade: number;
  observacao: string;
};

type TeamMember = {
  matricula: string;
  nome: string;
  funcao: string;
};

type ColetaData = {
  data: string;
  linha: string;
  item: string;
  quantidade: number;
  equipe: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

const findHeader = (headers: string[], needle: string) =>
  headers.find((header) => normalize(header).includes(needle));

export default function App() {
  const [baseRows, setBaseRows] = useState<BaseRow[]>([]);
  const [baseHeaders, setBaseHeaders] = useState<string[]>([]);
  const [baseError, setBaseError] = useState("");
  const [baseStatus, setBaseStatus] = useState("Carregando base automática...");
  const [matricula, setMatricula] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"informe" | "equipe" | "coleta">("informe");

  const [informeForm, setInformeForm] = useState<InformeData>({
    data: "",
    turno: "Manhã",
    produto: "",
    quantidade: 0,
    observacao: ""
  });
  const [informes, setInformes] = useState<InformeData[]>([]);

  const [teamForm, setTeamForm] = useState<TeamMember>({
    matricula: "",
    nome: "",
    funcao: ""
  });
  const [team, setTeam] = useState<TeamMember[]>([]);

  const [coletaForm, setColetaForm] = useState<ColetaData>({
    data: "",
    linha: "",
    item: "",
    quantidade: 0,
    equipe: ""
  });
  const [coletas, setColetas] = useState<ColetaData[]>([]);

  const matriculaHeader = useMemo(() => findHeader(baseHeaders, "matricula"), [baseHeaders]);
  const nomeHeader = useMemo(() => findHeader(baseHeaders, "nome") ?? findHeader(baseHeaders, "name"), [baseHeaders]);

  const parseCsvFile = (file: File) => {
    Papa.parse<BaseRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.filter((row) =>
          Object.values(row).some((value) => value && value.toString().trim() !== "")
        );
        setBaseRows(rows);
        setBaseHeaders(Object.keys(rows[0] ?? {}));
      },
      error: (error) => {
        setBaseError(error.message);
      }
    });
  };

  const setBaseData = (rows: BaseRow[]) => {
    const filtered = rows.filter((row) =>
      Object.values(row).some((value) => value && value.toString().trim() !== "")
    );
    setBaseRows(filtered);
    setBaseHeaders(Object.keys(filtered[0] ?? {}));
  };

  const parseXlsxBuffer = (buffer: ArrayBuffer) => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<BaseRow>(sheet, { defval: "" });
    setBaseData(rows);
  };

  const parseXlsxFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      parseXlsxBuffer(buffer);
    } catch (error) {
      setBaseError(error instanceof Error ? error.message : "Erro ao ler Excel.");
    }
  };

  const handleBaseUpload = (file: File) => {
    setBaseError("");
    setBaseStatus(`Base carregada manualmente: ${file.name}`);
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      void parseXlsxFile(file);
      return;
    }
    parseCsvFile(file);
  };

  useEffect(() => {
    const loadAutoBase = async () => {
      try {
        const response = await fetch("/APPsInformeProducao.xlsx");
        if (!response.ok) {
          setBaseStatus("Base automática não encontrada. Faça upload manual.");
          return;
        }
        const buffer = await response.arrayBuffer();
        parseXlsxBuffer(buffer);
        setBaseStatus("Base automática carregada: APPsInformeProducao.xlsx");
      } catch (error) {
        setBaseStatus("Não foi possível carregar a base automática.");
        setBaseError(error instanceof Error ? error.message : "Erro ao ler base automática.");
      }
    };

    void loadAutoBase();
  }, []);

  const validateMatricula = () => {
    if (!matriculaHeader) {
      setLoginError("A planilha precisa ter uma coluna de matrícula.");
      return false;
    }
    if (!matricula.trim()) {
      setLoginError("Informe a matrícula.");
      return false;
    }
    const normalized = normalize(matricula);
    const exists = baseRows.some((row) => normalize(row[matriculaHeader] ?? "") === normalized);
    if (!exists) {
      setLoginError("Matrícula não encontrada na planilha base.");
      return false;
    }
    setLoginError("");
    return true;
  };

  const handleLogin = () => {
    if (baseRows.length === 0) {
      setLoginError("Carregue a planilha base antes de entrar.");
      return;
    }
    if (validateMatricula()) {
      setLoggedIn(true);
    }
  };

  const addInforme = () => {
    if (!informeForm.data || !informeForm.produto) {
      return;
    }
    setInformes((prev) => [...prev, informeForm]);
    setInformeForm({ data: "", turno: "Manhã", produto: "", quantidade: 0, observacao: "" });
  };

  const addTeamMember = () => {
    if (!teamForm.matricula || !teamForm.nome) {
      return;
    }
    setTeam((prev) => [...prev, teamForm]);
    setTeamForm({ matricula: "", nome: "", funcao: "" });
  };

  const fillNameFromBase = () => {
    if (!nomeHeader || !matriculaHeader || !teamForm.matricula) {
      return;
    }
    const normalized = normalize(teamForm.matricula);
    const match = baseRows.find((row) => normalize(row[matriculaHeader] ?? "") === normalized);
    if (match) {
      setTeamForm((prev) => ({
        ...prev,
        nome: match[nomeHeader] ?? prev.nome
      }));
    }
  };

  const addColeta = () => {
    if (!coletaForm.data || !coletaForm.item) {
      return;
    }
    setColetas((prev) => [...prev, coletaForm]);
    setColetaForm({ data: "", linha: "", item: "", quantidade: 0, equipe: "" });
  };

  const downloadColetas = () => {
    if (coletas.length === 0) {
      return;
    }
    const csv = Papa.unparse(coletas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "coletas.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = (rows: unknown[], filename: string) => {
    if (rows.length === 0) {
      return;
    }
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadXlsx = (rows: unknown[], filename: string, sheetName: string) => {
    if (rows.length === 0) {
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
  };

  const baseInfo = baseRows.length
    ? `${baseRows.length} registros carregados`
    : baseStatus;

  if (!loggedIn) {
    return (
      <div className="app login">
        <div className="card">
          <div className="brand">
            <div className="badge">AppInformediario</div>
            <h1>Login por matrícula</h1>
            <p className="notice">Carregue a planilha base e valide a matrícula.</p>
          </div>
          <div className="field">
            <label>Planilha base (CSV ou XLSX)</label>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleBaseUpload(file);
                }
              }}
            />
            <div className="stat">{baseInfo}</div>
            {baseError && <div className="error">{baseError}</div>}
          </div>
          <div className="field">
            <label>Matrícula</label>
            <input
              value={matricula}
              onChange={(event) => setMatricula(event.target.value)}
              placeholder="Digite sua matrícula"
            />
          </div>
          {loginError && <div className="error">{loginError}</div>}
          <div className="button-row">
            <button onClick={handleLogin}>Entrar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="badge">AppInformediario</div>
          <h1>Informe Diário de Produção</h1>
          <div className="stat">{baseInfo}</div>
        </div>
        <div className="button-row">
          <button className="secondary" onClick={() => setLoggedIn(false)}>
            Sair
          </button>
        </div>
      </header>

      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "informe" ? "active" : ""}`}
            onClick={() => setActiveTab("informe")}
          >
            Informe de Produção
          </button>
          <button
            className={`tab ${activeTab === "equipe" ? "active" : ""}`}
            onClick={() => setActiveTab("equipe")}
          >
            Equipe de Produção
          </button>
          <button
            className={`tab ${activeTab === "coleta" ? "active" : ""}`}
            onClick={() => setActiveTab("coleta")}
          >
            Coletar Dados
          </button>
        </div>

        {activeTab === "informe" && (
          <div>
            <div className="grid">
              <div className="field">
                <label>Data</label>
                <input
                  type="date"
                  value={informeForm.data}
                  onChange={(event) =>
                    setInformeForm((prev) => ({ ...prev, data: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Turno</label>
                <select
                  value={informeForm.turno}
                  onChange={(event) =>
                    setInformeForm((prev) => ({ ...prev, turno: event.target.value }))
                  }
                >
                  <option>Manhã</option>
                  <option>Tarde</option>
                  <option>Noite</option>
                </select>
              </div>
              <div className="field">
                <label>Produto</label>
                <input
                  value={informeForm.produto}
                  onChange={(event) =>
                    setInformeForm((prev) => ({ ...prev, produto: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Quantidade</label>
                <input
                  type="number"
                  min="0"
                  value={informeForm.quantidade}
                  onChange={(event) =>
                    setInformeForm((prev) => ({ ...prev, quantidade: Number(event.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Observações</label>
              <textarea
                value={informeForm.observacao}
                onChange={(event) =>
                  setInformeForm((prev) => ({ ...prev, observacao: event.target.value }))
                }
              />
            </div>
            <div className="button-row">
              <button onClick={addInforme}>Salvar Informe</button>
              <button
                className="secondary"
                onClick={() => downloadCsv(informes, "informes.csv")}
              >
                Exportar CSV
              </button>
              <button
                className="secondary"
                onClick={() => downloadXlsx(informes, "informes.xlsx", "Informes")}
              >
                Exportar Excel
              </button>
            </div>

            {informes.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Turno</th>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {informes.map((item, index) => (
                    <tr key={`${item.data}-${index}`}>
                      <td>{item.data}</td>
                      <td>{item.turno}</td>
                      <td>{item.produto}</td>
                      <td>{item.quantidade}</td>
                      <td>{item.observacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "equipe" && (
          <div>
            <div className="grid">
              <div className="field">
                <label>Matrícula</label>
                <input
                  value={teamForm.matricula}
                  onChange={(event) =>
                    setTeamForm((prev) => ({ ...prev, matricula: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Nome</label>
                <input
                  value={teamForm.nome}
                  onChange={(event) =>
                    setTeamForm((prev) => ({ ...prev, nome: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Função</label>
                <input
                  value={teamForm.funcao}
                  onChange={(event) =>
                    setTeamForm((prev) => ({ ...prev, funcao: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="button-row">
              <button onClick={addTeamMember}>Adicionar</button>
              <button className="secondary" onClick={fillNameFromBase}>
                Buscar nome na base
              </button>
              <button
                className="secondary"
                onClick={() => downloadCsv(team, "equipe.csv")}
              >
                Exportar CSV
              </button>
              <button
                className="secondary"
                onClick={() => downloadXlsx(team, "equipe.xlsx", "Equipe")}
              >
                Exportar Excel
              </button>
            </div>

            {team.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Matrícula</th>
                    <th>Nome</th>
                    <th>Função</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member, index) => (
                    <tr key={`${member.matricula}-${index}`}>
                      <td>{member.matricula}</td>
                      <td>{member.nome}</td>
                      <td>{member.funcao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "coleta" && (
          <div>
            <div className="grid">
              <div className="field">
                <label>Data</label>
                <input
                  type="date"
                  value={coletaForm.data}
                  onChange={(event) =>
                    setColetaForm((prev) => ({ ...prev, data: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Linha</label>
                <input
                  value={coletaForm.linha}
                  onChange={(event) =>
                    setColetaForm((prev) => ({ ...prev, linha: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Item</label>
                <input
                  value={coletaForm.item}
                  onChange={(event) =>
                    setColetaForm((prev) => ({ ...prev, item: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Quantidade</label>
                <input
                  type="number"
                  min="0"
                  value={coletaForm.quantidade}
                  onChange={(event) =>
                    setColetaForm((prev) => ({ ...prev, quantidade: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="field">
                <label>Equipe</label>
                <select
                  value={coletaForm.equipe}
                  onChange={(event) =>
                    setColetaForm((prev) => ({ ...prev, equipe: event.target.value }))
                  }
                >
                  <option value="">Selecione</option>
                  {team.map((member) => (
                    <option key={member.matricula} value={member.nome}>
                      {member.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="button-row">
              <button onClick={addColeta}>Adicionar coleta</button>
              <button className="secondary" onClick={downloadColetas}>
                Exportar CSV
              </button>
            </div>

            {coletas.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Linha</th>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Equipe</th>
                  </tr>
                </thead>
                <tbody>
                  {coletas.map((item, index) => (
                    <tr key={`${item.data}-${index}`}>
                      <td>{item.data}</td>
                      <td>{item.linha}</td>
                      <td>{item.item}</td>
                      <td>{item.quantidade}</td>
                      <td>{item.equipe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
