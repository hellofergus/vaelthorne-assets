// Character creation state
class CharacterCreationState {
    constructor() {
        this.selectedRace = null;
        this.selectedLineage = null;
        this.listeners = [];
    }

    setRace(raceId) {
        this.selectedRace = raceId;
        // Reset lineage when race changes
        this.selectedLineage = null;
        this.notifyListeners();
    }

    setLineage(lineageId) {
        this.selectedLineage = lineageId;
        this.notifyListeners();
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this));
    }
}

// Global state instance
const characterState = new CharacterCreationState();

// Race data will be loaded from JSON
let raceData = null;

// Initialize the character creation system
async function initializeCharacterCreation() {
    try {
        // Load race data
        const response = await fetch('character-data.json');
        raceData = await response.json();
        
        // Generate race cards
        generateRaceCards();
        
        // Set up state listener for UI updates
        characterState.addListener(updateCharacterSummary);
        
    } catch (error) {
        console.error('Failed to load character data:', error);
    }
}

// Generate race selection cards
function generateRaceCards() {
    const container = document.getElementById('race-cards');
    
    raceData.races.forEach(race => {
        const card = createRaceCard(race);
        container.appendChild(card);
    });
}

// Create individual race card
function createRaceCard(race) {
    const card = document.createElement('div');
    card.className = 'race-card';
    card.dataset.raceId = race.id;
    
    const title = document.createElement('h3');
    title.textContent = race.name;
    
    const description = document.createElement('p');
    description.textContent = race.description;
    
    card.appendChild(title);
    card.appendChild(description);
    
    // Add lineage dropdown for races that have lineages (like Elf)
    if (race.hasLineages && race.lineages) {
        const dropdownContainer = document.createElement('div');
        const dropdown = document.createElement('select');
        dropdown.className = 'lineage-dropdown';
        dropdown.id = `lineage-${race.id}`;
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Choose lineage...';
        dropdown.appendChild(defaultOption);
        
        // Add lineage options
        race.lineages.forEach(lineage => {
            const option = document.createElement('option');
            option.value = lineage.id;
            option.textContent = lineage.name;
            option.title = lineage.description;
            dropdown.appendChild(option);
        });
        
        // Handle lineage selection
        dropdown.addEventListener('change', (e) => {
            if (e.target.value) {
                characterState.setLineage(e.target.value);
            }
        });
        
        dropdownContainer.appendChild(dropdown);
        card.appendChild(dropdownContainer);
    }
    
    // Handle race selection
    card.addEventListener('click', (e) => {
        // Don't trigger race selection when clicking on dropdown
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') {
            return;
        }
        
        selectRace(race.id);
    });
    
    return card;
}

// Handle race selection
function selectRace(raceId) {
    // Remove previous selection
    document.querySelectorAll('.race-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    const selectedCard = document.querySelector(`[data-race-id="${raceId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Update state
    characterState.setRace(raceId);
    
    // Enable/disable lineage dropdowns
    updateLineageDropdowns(raceId);
}

// Update lineage dropdowns based on selected race
function updateLineageDropdowns(selectedRaceId) {
    document.querySelectorAll('.lineage-dropdown').forEach(dropdown => {
        const raceId = dropdown.id.replace('lineage-', '');
        
        if (raceId === selectedRaceId) {
            dropdown.disabled = false;
            dropdown.style.opacity = '1';
        } else {
            dropdown.disabled = true;
            dropdown.style.opacity = '0.5';
            dropdown.value = ''; // Reset dropdown
        }
    });
}

// Update character summary display
function updateCharacterSummary(state) {
    const raceSpan = document.getElementById('selected-race');
    const lineageSpan = document.getElementById('selected-lineage');
    const lineageDisplay = document.getElementById('selected-lineage-display');
    
    // Update race display
    if (state.selectedRace) {
        const race = raceData.races.find(r => r.id === state.selectedRace);
        raceSpan.textContent = race ? race.name : 'Unknown';
    } else {
        raceSpan.textContent = 'None';
    }
    
    // Update lineage display
    if (state.selectedRace && state.selectedLineage) {
        const race = raceData.races.find(r => r.id === state.selectedRace);
        if (race && race.lineages) {
            const lineage = race.lineages.find(l => l.id === state.selectedLineage);
            if (lineage) {
                lineageSpan.textContent = lineage.name;
                lineageDisplay.style.display = 'block';
            }
        }
    } else {
        lineageDisplay.style.display = 'none';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCharacterCreation);

// Export for potential external use
window.CharacterCreation = {
    state: characterState,
    setLineage: (lineageId) => characterState.setLineage(lineageId),
    setRace: (raceId) => selectRace(raceId)
};