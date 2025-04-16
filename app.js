document.getElementById('searchButton').addEventListener('click', function() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    fetch(`https://pokeapi.co/api/v2/pokemon/${query}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Pokémon not found');
            }
            return response.json();
        })
        .then(data => {
            displayResults(data);
        })
        .catch(error => {
            alert(error.message);
        });
});

document.getElementById('listAllButton').addEventListener('click', function() {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=100')
        .then(response => response.json())
        .then(data => {
            const resultsContainer = document.getElementById('resultsContainer');
            resultsContainer.innerHTML = '';
            data.results.forEach(pokemon => {
                const listItem = document.createElement('p');
                listItem.textContent = pokemon.name;
                resultsContainer.appendChild(listItem);
            });
            document.getElementById('backToSearchButton').style.display = 'block';
            document.getElementById('searchButton').style.display = 'none';
            document.getElementById('listAllButton').style.display = 'none';
        })
        .catch(error => {
            alert('Error fetching Pokémon list');
        });
});

// Add event listener for the back button

document.getElementById('backToSearchButton').addEventListener('click', function() {
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('backToSearchButton').style.display = 'none';
    document.getElementById('searchButton').style.display = 'block';
    document.getElementById('listAllButton').style.display = 'block';
});

function displayResults(pokemon) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    const resultItem = document.createElement('div');
    resultItem.classList.add('result-item');

    const img = document.createElement('img');
    img.src = pokemon.sprites.front_default;
    resultItem.appendChild(img);

    const name = document.createElement('h3');
    name.textContent = pokemon.name;
    resultItem.appendChild(name);

    const type = document.createElement('p');
    type.textContent = `Type: ${pokemon.types.map(t => t.type.name).join(', ')}`;
    resultItem.appendChild(type);

    const height = document.createElement('p');
    height.textContent = `Height: ${pokemon.height}`;
    resultItem.appendChild(height);

    const weight = document.createElement('p');
    weight.textContent = `Weight: ${pokemon.weight}`;
    resultItem.appendChild(weight);

    const abilities = document.createElement('p');
    abilities.textContent = `Abilities: ${pokemon.abilities.map(a => a.ability.name).join(', ')}`;
    resultItem.appendChild(abilities);

    resultsContainer.appendChild(resultItem);
} 