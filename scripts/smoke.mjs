import Papa from "papaparse";

const csv = "matricula,nome\n123,Ana\n456,Caio";
const result = Papa.parse(csv, { header: true, skipEmptyLines: true });

const hasMatricula = result.data.some((row) => row.matricula === "123");

if (!hasMatricula) {
  throw new Error("Matrícula não encontrada no teste.");
}

console.log("Smoke OK: matrícula validada.");
