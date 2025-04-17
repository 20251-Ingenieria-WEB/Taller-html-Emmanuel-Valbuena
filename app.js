// Endpoints
const API_BASE = 'https://pokeapi.co/api/v2/pokemon/';
const TYPE_ENDPOINT = 'https://pokeapi.co/api/v2/type';
const ABILITY_ENDPOINT = 'https://pokeapi.co/api/v2/ability?limit=327';

// Elementos del DOM
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

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  loadTypeOptions();
  loadAbilityOptions();
});

// Populate tipos
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

// Populate habilidades
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

// Listeners
searchBtn.addEventListener('click', () => handleSearch());
listBtn.addEventListener('click', () => fetchPokemonList());
filterBtn.addEventListener('click', () => handleFilter());
createGrpBtn.addEventListener('click', () => createGroup());

document.addEventListener('click', event => {
  if (event.target.classList.contains('delete-group-btn')) {
    event.target.closest('.group').remove();
  }
});

// Ejemplo de uso en fetch:
async function handleSearch() {
  const name = inputEl.value.trim().toLowerCase();
  if (!name) return showError('Ingresa un nombre de Pokémon');
  clearUI();
  toggleLoading(true);
  try {
    const res = await fetch(API_BASE + name);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderPokemonCard(data);
  } catch {
    showError('Pokémon no encontrado.');
  } finally {
    toggleLoading(false);
  }
}


// Listar primeros 151
async function fetchPokemonList() {
  clearUI();
  toggleLoading(true);
  try {
    const res = await fetch(`${API_BASE}?limit=151`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderPokemonList(data.results);
  } catch {
    showError('Error al cargar lista de Pokémon.');
  } finally {
    toggleLoading(false);
  }
}

// Filtrar por tipo/ habilidad
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
      const res2 = await fetch(`${ABILITY_ENDPOINT.replace('?limit=327', '')}/${ability}`);
      const data2 = await res2.json();
      const abilNames = data2.pokemon.map(p => p.pokemon.name);
      names = type ? names.filter(n => abilNames.includes(n)) : abilNames;
    }
    if (names.length === 0) return showError('No se encontraron Pokémon con los filtros seleccionados.');

    // Render tarjetas seleccionadas (hasta 100 para performance)
    names.slice(0, 100).forEach(async name => {
      try {
        const r = await fetch(API_BASE + name);
        if (!r.ok) return;
        const p = await r.json();
        renderPokemonCard(p);
      } catch (error) {
        console.error('Error al renderizar Pokémon:', error);
      }
    });
  } catch (error) {
    showError('Error al aplicar filtros.');
    console.error('Error en handleFilter:', error);
  }
}

// Crear grupo con seleccionados
async function createGroup() {
  clearUI();
  const name = groupNameEl.value.trim();
  const checked = Array.from(document.querySelectorAll('.pokemon-card input:checked'))
    .map(cb => cb.getAttribute('data-name'));
  if (!name) return showError('Ingresa un nombre de grupo.');
  if (checked.length === 0) return showError('Selecciona al menos un Pokémon.');

  const sec = document.createElement('section');
  sec.className = 'group';
  sec.innerHTML = `<h2>${name}<button class="delete-group-btn">×</button></h2><div class="group-results"></div>`;
  groupsCont.append(sec);
  const container = sec.querySelector('.group-results');
  for (let nm of checked) {
    try {
      const res = await fetch(API_BASE + nm);
      if (!res.ok) continue;
      const p = await res.json();
      const c = document.createElement('div');
      c.className = 'pokemon-card';
      c.innerHTML = `
        <img src="${p.sprites.front_default}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>Tipo: ${p.types.map(t => t.type.name).join(', ')}</p>
        <p>Altura: ${p.height / 10} m</p>
        <p>Peso: ${p.weight / 10} kg</p>
        <p>Hab: ${p.abilities.map(a => a.ability.name).join(', ')}</p>
      `;
      container.appendChild(c);
    } catch (error) {
      console.error('Error al agregar Pokémon al grupo:', error);
    }
  }
  groupNameEl.value = '';
}

// Render helpers
function renderPokemonCard(p) {
  const card = document.createElement('div');
  card.className = 'pokemon-card';
  card.innerHTML = `
    <input type="checkbox" data-name="${p.name}">
    <img src="${p.sprites.front_default}" alt="${p.name}">
    <h3>${p.name}</h3>
    <p>Tipo: ${p.types.map(t => t.type.name).join(', ')}</p>
    <p>Altura: ${p.height / 10} m</p>
    <p>Peso: ${p.weight / 10} kg</p>
    <p>Hab: ${p.abilities.map(a => a.ability.name).join(', ')}</p>
  `;
  results.append(card);
}


function toggleLoading(show) {
  const ld = document.getElementById('loading');
  if (!ld) return;            // si no existe, salimos
  ld.classList.toggle('hidden', !show);
}

// Ejemplo de uso en fetch:
async function handleSearch() {
  const name = inputEl.value.trim().toLowerCase();
  if (!name) return showError('Ingresa un nombre de Pokémon');
  clearUI();
  toggleLoading(true);
  try {
    const res = await fetch(API_BASE + name);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderPokemonCard(data);
  } catch {
    showError('Pokémon no encontrado.');
  } finally {
    toggleLoading(false);
  }
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