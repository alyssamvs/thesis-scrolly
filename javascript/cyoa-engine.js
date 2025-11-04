/**
 * CYOA Game Engine for Cocaine Supply Chain Interactive
 * Loads CSV/JSON data and manages game state
 */

class CYOAEngine {
    constructor() {
        this.nodes = new Map();
        this.choices = new Map();
        this.endings = [];
        this.currentNode = null;
        this.scores = {
            risk: 0,
            moral: 0,
            economic: 0,
            knowledge: 0
        };
        this.history = [];
    }

    /**
     * Load CSV data and parse it
     */
    async loadCSV(url) {
        const response = await fetch(url);
        const text = await response.text();
        return this.parseCSV(text);
    }

    /**
     * Parse CSV text into array of objects
     */
    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index];
                });
                data.push(obj);
            }
        }
        return data;
    }

    /**
     * Parse a single CSV line, handling quoted fields
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    }

    /**
     * Load all game data
     */
    async loadData(nodesURL, choicesURL, endingsURL) {
        try {
            // Load nodes
            const nodesData = await this.loadCSV(nodesURL);
            nodesData.forEach(node => {
                this.nodes.set(node.node_id, node);
            });

            // Load choices
            const choicesData = await this.loadCSV(choicesURL);
            choicesData.forEach(choice => {
                if (!this.choices.has(choice.node_id)) {
                    this.choices.set(choice.node_id, []);
                }
                this.choices.get(choice.node_id).push(choice);
            });

            // Load endings
            const endingsResponse = await fetch(endingsURL);
            const endingsData = await endingsResponse.json();
            this.endings = endingsData.endings;

            console.log('Data loaded:', {
                nodes: this.nodes.size,
                choices: this.choices.size,
                endings: this.endings.length
            });

            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    /**
     * Start the game at a specific node
     */
    startGame(startNodeId = 'farmer_start') {
        this.currentNode = this.nodes.get(startNodeId);
        this.scores = { risk: 0, moral: 0, economic: 0, knowledge: 0 };
        this.history = [startNodeId];
        
        if (!this.currentNode) {
            console.error('Start node not found:', startNodeId);
            return null;
        }

        return this.getCurrentState();
    }

    /**
     * Make a choice and progress to next node
     */
    makeChoice(choiceId) {
        const availableChoices = this.choices.get(this.currentNode.node_id) || [];
        const selectedChoice = availableChoices.find(c => c.choice_id === choiceId);

        if (!selectedChoice) {
            console.error('Choice not found:', choiceId);
            return null;
        }

        // Update scores
        if (selectedChoice.consequence_type && selectedChoice.consequence_value) {
            const scoreType = selectedChoice.consequence_type;
            const scoreChange = parseInt(selectedChoice.consequence_value);
            this.scores[scoreType] = (this.scores[scoreType] || 0) + scoreChange;
        }

        // Move to next node
        const nextNodeId = selectedChoice.next_node;
        this.currentNode = this.nodes.get(nextNodeId);
        this.history.push(nextNodeId);

        if (!this.currentNode) {
            console.error('Next node not found:', nextNodeId);
            return null;
        }

        // Check if we've reached an ending
        if (this.currentNode.narrative_text === 'ENDING_NODE') {
            const ending = this.getTriggeredEnding();
            return {
                ...this.getCurrentState(),
                ending: ending,
                isEnding: true
            };
        }

        return this.getCurrentState();
    }

    /**
     * Get current game state
     */
    getCurrentState() {
        const availableChoices = this.choices.get(this.currentNode.node_id) || [];
        
        return {
            node: this.currentNode,
            choices: availableChoices,
            scores: { ...this.scores },
            history: [...this.history],
            isEnding: this.currentNode.narrative_text === 'ENDING_NODE'
        };
    }

    /**
     * Determine which ending should be triggered based on scores
     */
    getTriggeredEnding() {
        // Find the ending that matches current conditions
        for (const ending of this.endings) {
            if (this.checkEndingCondition(ending.condition)) {
                return ending;
            }
        }
        return null;
    }

    /**
     * Check if ending condition matches current scores
     */
    checkEndingCondition(condition) {
        for (const [scoreType, requirement] of Object.entries(condition)) {
            const currentScore = this.scores[scoreType] || 0;
            
            if (!this.evaluateCondition(currentScore, requirement)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Evaluate a condition string like ">=10" or "<6"
     */
    evaluateCondition(value, requirement) {
        const requirementStr = String(requirement);
        
        if (requirementStr.startsWith('>=')) {
            return value >= parseInt(requirementStr.substring(2));
        } else if (requirementStr.startsWith('<=')) {
            return value <= parseInt(requirementStr.substring(2));
        } else if (requirementStr.startsWith('>')) {
            return value > parseInt(requirementStr.substring(1));
        } else if (requirementStr.startsWith('<')) {
            return value < parseInt(requirementStr.substring(1));
        } else if (requirementStr.startsWith('==')) {
            return value == parseInt(requirementStr.substring(2));
        }
        
        return false;
    }

    /**
     * Restart the game
     */
    restart() {
        return this.startGame();
    }

    /**
     * Get game statistics
     */
    getStats() {
        return {
            nodesVisited: this.history.length,
            scores: { ...this.scores },
            path: this.history
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CYOAEngine;
}