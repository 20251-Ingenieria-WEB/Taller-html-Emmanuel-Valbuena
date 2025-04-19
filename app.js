// --- Configuración de Endpoints de la PokéAPI ---
const API_BASE = 'https://pokeapi.co/api/v2/pokemon/';
const TYPE_ENDPOINT = 'https://pokeapi.co/api/v2/type';
const ABILITY_ENDPOINT = 'https://pokeapi.co/api/v2/ability?limit=327';

// --- Referencias al DOM ---
const inputEl = document.getElementById('pokemon-input');
const searchBtn = document.getElementById('search-btn');
const listBtn = document.getElementById('list-btn');
const typeSelect = document.getElementById('filter-type');
const abilitySelect = document.getElementById('filter-ability');
const filterBtn = document.getElementById('apply-filter-btn');
const createGrpBtn = document.getElementById('create-group-btn');
const groupNameEl = document.getElementById('group-name');
const results = document.getElementById('results');
const errorEl = document.getElementById('error-message');
const groupsCont = document.getElementById('groups');

// --- Inicialización de la aplicación ---
// Carga tipos y habilidades cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  loadTypeOptions();
  loadAbilityOptions();
});

// --- Delegación global de eventos ---
document.addEventListener('click', event => {
  // 1) Eliminar grupo existente
  if (event.target.classList.contains('delete-group-btn')) {
    event.target.closest('.group').remove();
  }
  // 2) Toggle de información extra en tarjetas
  if (event.target.classList.contains('toggle-info-btn')) {
    const card = event.target.closest('.pokemon-card');
    const extra = card.querySelector('.extra-info');
    extra.classList.toggle('hidden');
    // Cambiar texto del botón según estado
    event.target.textContent = extra.classList.contains('hidden')
      ? 'Mostrar más 🔍'
      : 'Mostrar menos 🔽';
  }
});

// --- Funciones para poblar los selects ---
async function loadTypeOptions() {
  try {
    const res = await fetch(TYPE_ENDPOINT);
    const data = await res.json();
    data.results.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = t.name;
      typeSelect.append(opt);
    });
  } catch (error) {
    console.error('Error al cargar tipos:', error);
  }
}

async function loadAbilityOptions() {
  try {
    const res = await fetch(ABILITY_ENDPOINT);
    const data = await res.json();
    data.results.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.name;
      opt.textContent = a.name;
      abilitySelect.append(opt);
    });
  } catch (error) {
    console.error('Error al cargar habilidades:', error);
  }
}

// --- Listeners de botones ---
searchBtn.addEventListener('click', handleSearch);
listBtn.addEventListener('click', fetchPokemonList);
filterBtn.addEventListener('click', handleFilter);
createGrpBtn.addEventListener('click', createGroup);

// --- Búsqueda de un Pokémon por nombre ---
async function handleSearch() {
  const name = inputEl.value.trim().toLowerCase();
  if (!name) return showError('Ingresa un nombre de Pokémon');
  clearUI();
  toggleLoading(true);
  try {
    const res = await fetch(API_BASE + name);
    if (!res.ok) throw new Error('No encontrado');
    const data = await res.json();
    renderPokemonCard(data);
  } catch (error) {
    showError('Pokémon no encontrado.');
    console.error('handleSearch:', error);
  } finally {
    toggleLoading(false);
  }
}

// --- Listado de los primeros 151 Pokémon ---
async function fetchPokemonList() {
  clearUI();
  toggleLoading(true);
  try {
    const res = await fetch(`${API_BASE}?limit=151`);
    if (!res.ok) throw new Error('Falló fetch list');
    const data = await res.json();
    renderPokemonList(data.results);
  } catch (error) {
    console.error('fetchPokemonList:', error);
    showError('Error al cargar lista de Pokémon.');
  } finally {
    toggleLoading(false);
  }
}

// --- Renderizado de una lista de URLs de Pokémon ---
function renderPokemonList(pokemonArray) {
  pokemonArray.forEach(async p => {
    try {
      const res = await fetch(p.url);
      if (!res.ok) return;
      const data = await res.json();
      renderPokemonCard(data);
    } catch (error) {
      console.error('renderPokemonList:', error);
    }
  });
}

// --- Filtrado por tipo y/o habilidad ---
async function handleFilter() {
  const type = typeSelect.value;
  const ability = abilitySelect.value;
  if (!type && !ability) return showError('Selecciona un tipo o habilidad.');
  clearUI();
  let names = [];
  try {
    if (type) {
      const res = await fetch(`${TYPE_ENDPOINT}/${type}`);
      const data = await res.json();
      names = data.pokemon.map(p => p.pokemon.name);
    }
    if (ability) {
      const url = ABILITY_ENDPOINT.replace('?limit=327', '') + `/${ability}`;
      const res2 = await fetch(url);
      const data2 = await res2.json();
      const abilNames = data2.pokemon.map(p => p.pokemon.name);
      names = type ? names.filter(n => abilNames.includes(n)) : abilNames;
    }
    if (names.length === 0) return showError('No se encontraron Pokémon con esos filtros.');
    // Pintar hasta 100 para no saturar
    names.slice(0, 100).forEach(async name => {
      try {
        const r = await fetch(API_BASE + name);
        if (!r.ok) return;
        const p = await r.json();
        renderPokemonCard(p);
      } catch (error) {
        console.error('handleFilter render:', error);
      }
    });
  } catch (error) {
    console.error('handleFilter:', error);
    showError('Error al aplicar filtros.');
  }
}

// --- Creación de grupos personalizados con selección ---
async function createGroup() {
  const name = groupNameEl.value.trim();
  const checked = Array.from(
    document.querySelectorAll('.pokemon-card input:checked')
  ).map(cb => cb.dataset.name);

  if (!name) return showError('Ingresa un nombre de grupo.');
  if (checked.length === 0) return showError('Selecciona al menos un Pokémon.');

  const sec = document.createElement('section');
  sec.className = 'group';
  sec.innerHTML = `
    <h2>${name}<button class="delete-group-btn">×</button></h2>
    <div class="group-results"></div>
  `;
  groupsCont.append(sec);

  // Agregar cada Pokémon seleccionado al grupo
  const container = sec.querySelector('.group-results');
  for (let nm of checked) {
    try {
      const res = await fetch(API_BASE + nm);
      if (!res.ok) continue;
      const p = await res.json();
      container.appendChild(createCardContent(p));
    } catch (error) {
      console.error('createGroup:', error);
    }
  }
  groupNameEl.value = '';
}

// --- Renderizado de una tarjeta individual ---
function renderPokemonCard(p) {
  const card = createCardContent(p);
  results.appendChild(card);
}

// --- Construcción del HTML de la tarjeta (compacta + toggle) ---
function createCardContent(p) {
  const card = document.createElement('div');
  card.className = 'pokemon-card';
  card.innerHTML = `
    <input type="checkbox" data-name="${p.name}">
    <img src="${p.sprites.front_default}" alt="${p.name}">
    <h3>${p.name}</h3>
    <div class="basic-info">
      <p>Tipo: ${p.types.map(t => t.type.name).join(', ')}</p>
      <p>Altura: ${p.height/10} m</p>
      <p>Peso: ${p.weight/10} kg</p>
    </div>
    <!-- Botón personalizado para toggle -->
    <button class="toggle-info-btn">Mostrar más 🔍</button>
    <div class="extra-info hidden">
      <p>Base Exp: ${p.base_experience}</p>
      <p>Stats: ${p.stats.map(s => `${s.stat.name}(${s.base_stat})`).join(', ')}</p>
      <p>Movs: ${p.moves.slice(0,3).map(m => m.move.name).join(', ')}</p>
    </div>
  `;
  return card;
}

// --- Helpers de UI ---
function toggleLoading(show) {
  const ld = document.getElementById('loading');
  if (!ld) return;
  ld.classList.toggle('hidden', !show);
}

function clearUI() {
  results.innerHTML = '';
  errorEl.classList.add('hidden');
  toggleLoading(false);
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
  toggleLoading(false);
}
