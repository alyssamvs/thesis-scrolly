

class CYOAEngine {
    constructor() {
        this.nodes = new Map();
        this.choices = new Map();
        this.endings = [];
        this.currentNode = null;
        this.history = [];
        this.startNodeId = null; 
    }

    /**
     * Load CSV 
     */
    async loadCSV(url) {
        const response = await fetch(url);
        const text = await response.text();
        return this.parseCSV(text);
    }

    /**
     * Parse CSV 
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
     * Parse a single CSV line
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
     * Detect starting node from loaded data
     */
    getStartNode() {
        for (let [nodeId, node] of this.nodes) {
            if (nodeId.endsWith('_start')) {
                return nodeId;
            }
        }
        return null;
    }

    /**
     * Start the game 
     */
    startGame(startNodeId = null) {
        // auto detect
        if (!startNodeId) {
            startNodeId = this.getStartNode();
            if (!startNodeId) {
                console.error('No starting node found. Make sure your data has a node ending with "_start"');
                return null;
            }
            console.log('Auto-detected start node:', startNodeId);
        }

        this.currentNode = this.nodes.get(startNodeId);
        this.history = [startNodeId];
        this.startNodeId = startNodeId; 
        
        if (!this.currentNode) {
            console.error('Start node not found:', startNodeId);
            return null;
        }

        return this.getCurrentState();
    }

    /**
     * Make a choice and progress to next node or ending
     */
    makeChoice(choiceId) {
        const availableChoices = this.choices.get(this.currentNode.node_id) || [];
        const selectedChoice = availableChoices.find(c => c.choice_id === choiceId);

        if (!selectedChoice) {
            console.error('Choice not found:', choiceId);
            return null;
        }

        // Get next destination (either a story node or an ending)
        const nextNodeId = selectedChoice.next_node;
        this.history.push(nextNodeId);

        // Check if next_node is an ending ID
        const ending = this.endings.find(e => e.id === nextNodeId);
        
        if (ending) {
            // This choice leads directly to an ending
            return {
                ending: ending,
                isEnding: true,
                history: [...this.history]
            };
        }

        // Otherwise it's a story node - continue game
        this.currentNode = this.nodes.get(nextNodeId);
        
        if (!this.currentNode) {
            console.error('Next node not found:', nextNodeId);
            return null;
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
            history: [...this.history],
            isEnding: false
        };
    }

    /**
     * Get a specific ending by ID
     */
    getEnding(endingId) {
        return this.endings.find(e => e.id === endingId);
    }

    /**
     * Restart 
     */
    restart() {
        return this.startGame(this.startNodeId);
    }

    /**
     * Get game statistics
     */
    getStats() {
        return {
            nodesVisited: this.history.length,
            path: this.history
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CYOAEngine;
}