const LASTFM_API_KEY = "e5a5b7fce232c99a41fe30dfcb340fdb"; // 🔁 Substitua pela sua chave válida!
let isButtonDisabled = false;
let currentBand = null;

const proxy = "https://bandrandomizer.zanondev.com/proxy.php?url=";

function showLoading() {
  const button = document.getElementById("botaoGerarBandas");
  button.textContent = "Carregando...";
  button.disabled = true;
}

function hideCols() {
  document.querySelectorAll(".col").forEach((col) => {
    col.style.opacity = "0";
    col.style.transform = "translateY(20px)";
  });
}

function showCols() {
  document.querySelectorAll(".col").forEach((col, i) => {
    setTimeout(() => {
      col.style.opacity = "1";
      col.style.transform = "translateY(0)";
    }, i * 200);
  });
}

function enableButton() {
  const button = document.getElementById("botaoGerarBandas");
  button.textContent = "Randomizar";
  button.disabled = false;
  isButtonDisabled = false;
}

function populateBandInfo(band) {
  document.getElementById("bandaInfoListaItemNomeValor").textContent =
    band.name;
  document.getElementById("bandaInfoListaItemAnoValor").textContent = band.year;
  document.getElementById("bandaInfoListaItemGeneroValor").textContent =
    band.genre;
  document.getElementById("bandaInfoListaItemPaisValor").textContent =
    band.country;

  const listaMembros = document.getElementById("listaMembros");
  listaMembros.innerHTML = "";
  band.members.forEach((member) => {
    const li = document.createElement("li");
    li.className = "listaItem";
    li.textContent = member;
    listaMembros.appendChild(li);
  });

  const bandaMusicasLista = document.getElementById("bandaMusicasLista");
  bandaMusicasLista.innerHTML = "";
  band.famousSongs.forEach((song) => {
    const li = document.createElement("li");
    li.className = "listaItem";
    li.textContent = song;
    bandaMusicasLista.appendChild(li);
  });
}

async function getTopSongsFromLastFm(bandName) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(
    bandName
  )}&api_key=${LASTFM_API_KEY}&format=json&limit=4`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.toptracks?.track?.slice(0, 4).map((t) => t.name) || [];
  } catch (error) {
    console.error("Erro ao buscar músicas do Last.fm", error);
    return [];
  }
}

async function getRandomBandWith4Members() {
  const offset = Math.floor(Math.random() * 1000);
  const baseUrl = `https://musicbrainz.org/ws/2/artist?limit=100&offset=${offset}&fmt=json`;
  const response = await fetch(proxy + encodeURIComponent(baseUrl));
  const data = await response.json();
  const groups = (data.artists || []).filter((a) => a.type === "Group");

  for (const artist of groups) {
    const detailUrl = `https://musicbrainz.org/ws/2/artist/${artist.id}?fmt=json&inc=area+artist-rels+tags`;
    const detailRes = await fetch(proxy + encodeURIComponent(detailUrl));
    const details = await detailRes.json();

    const members = (details.relations || [])
      .filter((rel) => rel.type === "member of band" && rel.artist)
      .map((rel) => ({
        name: rel.artist.name,
        role: rel.attributes ? rel.attributes.join(", ") : "Membro",
      }));

    if (members.length === 4) {
      return {
        name: details.name,
        year: new Date(details["life-span"]?.begin || "0000").getFullYear(),
        genre: details.tags?.[0]?.name || "Desconhecido",
        country: details.area?.name || "Desconhecido",
        members: members.map((m) => `${m.name} (${m.role})`),
      };
    }
  }

  // Se nenhuma banda encontrada, tenta novamente
  return await getRandomBandWith4Members();
}

async function buscarBanda() {
  if (isButtonDisabled) return;

  isButtonDisabled = true;
  showLoading();
  hideCols();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const band = await getRandomBandWith4Members();
    const songs = await getTopSongsFromLastFm(band.name);
    currentBand = { ...band, famousSongs: songs };
    populateBandInfo(currentBand);
    showCols();
  } catch (error) {
    console.error("Erro ao buscar banda:", error);
    alert("Ocorreu um erro ao buscar dados da banda. Tente novamente.");
  }

  setTimeout(enableButton, 3000);
}

document.addEventListener("DOMContentLoaded", function () {
  hideCols();
});
