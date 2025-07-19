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

async function getRandomBandWith4Members(retryCount = 0) {
  const maxRetries = 3;

  if (retryCount >= maxRetries) {
    throw new Error(
      "Não foi possível encontrar uma banda com 4 membros após várias tentativas"
    );
  }

  const offset = Math.floor(Math.random() * 1000);
  // Fix: Use the correct MusicBrainz search endpoint
  const baseUrl = `https://musicbrainz.org/ws/2/artist/?query=type:Group&limit=100&offset=${offset}&fmt=json`;

  try {
    const proxyUrl = proxy + encodeURIComponent(baseUrl);
    console.log("Making request to:", proxyUrl);
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Proxy response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const groups = (data.artists || []).filter((a) => a.type === "Group");

    for (const artist of groups) {
      const detailUrl = `https://musicbrainz.org/ws/2/artist/${artist.id}?fmt=json&inc=area+artist-rels+tags`;
      const detailProxyUrl = proxy + encodeURIComponent(detailUrl);
      const detailRes = await fetch(detailProxyUrl);

      if (!detailRes.ok) {
        console.warn(
          `Failed to get details for artist ${artist.name}:`,
          detailRes.status
        );
        continue; // Skip this artist if detail request fails
      }

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

    // Se nenhuma banda encontrada, tenta novamente com contador
    return await getRandomBandWith4Members(retryCount + 1);
  } catch (error) {
    console.error("Erro ao buscar banda:", error);
    if (retryCount < maxRetries - 1) {
      return await getRandomBandWith4Members(retryCount + 1);
    }
    throw error;
  }
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

    let errorMessage = "Ocorreu um erro ao buscar dados da banda. ";

    if (error.message.includes("HTTP error")) {
      errorMessage += "Problema de conexão com a API. ";
    } else if (error.message.includes("Não foi possível encontrar")) {
      errorMessage += "Não foi possível encontrar uma banda adequada. ";
    } else {
      errorMessage += "Erro interno do servidor. ";
    }

    errorMessage += "Tente novamente.";
    alert(errorMessage);
  } finally {
    enableButton();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  hideCols();
});
