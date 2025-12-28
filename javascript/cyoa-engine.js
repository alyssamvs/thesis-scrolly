class CYOAEngine {
    constructor() {
        this.nodes = new Map();
        this.choices = new Map();
        this.endings = [];
        this.currentNode = null;
        this.history = [];
        this.startNodeId = null;
    }

    async loadCSV(url) {
        const response = await fetch(url);
        const text = await response.text();
        return this.parseCSV(text);
    }

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

    async loadData(nodesURL, choicesURL, endingsURL, character = null) {
        try {
            const characterName = character 
                ? character.charAt(0).toUpperCase() + character.slice(1)
                : null;

            const allNodesData = await this.loadCSV(nodesURL);
            
            const nodesData = characterName 
                ? allNodesData.filter(n => n.character === characterName)
                : allNodesData;
                
            nodesData.forEach(node => {
                this.nodes.set(node.node_id, node);
            });

            const allChoicesData = await this.loadCSV(choicesURL);
            
            const choicesData = characterName
                ? allChoicesData.filter(c => {
                    const node = nodesData.find(n => n.node_id === c.node_id);
                    return node !== undefined;
                  })
                : allChoicesData;
                
            choicesData.forEach(choice => {
                if (!this.choices.has(choice.node_id)) {
                    this.choices.set(choice.node_id, []);
                }
                this.choices.get(choice.node_id).push(choice);
            });

            const endingsResponse = await fetch(endingsURL);
            const endingsData = await endingsResponse.json();
            
            this.endings = characterName
                ? endingsData.endings.filter(e => e.character === characterName)
                : endingsData.endings;

            console.log('Data loaded:', {
                nodes: this.nodes.size,
                choices: this.choices.size,
                endings: this.endings.length,
                character: characterName || 'all'
            });

            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    getStartNode() {
        for (let [nodeId, node] of this.nodes) {
            if (nodeId.endsWith('_start')) {
                return nodeId;
            }
        }
        return null;
    }

    startGame(startNodeId = null) {
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

    makeChoice(choiceId) {
        const availableChoices = this.choices.get(this.currentNode.node_id) || [];
        const selectedChoice = availableChoices.find(c => c.choice_id === choiceId);

        if (!selectedChoice) {
            console.error('Choice not found:', choiceId);
            return null;
        }

        const nextNodeId = selectedChoice.next_node;
        this.history.push(nextNodeId);

        const ending = this.endings.find(e => e.id === nextNodeId);
        
        if (ending) {
            return {
                ending: ending,
                isEnding: true,
                history: [...this.history]
            };
        }

        this.currentNode = this.nodes.get(nextNodeId);
        
        if (!this.currentNode) {
            console.error('Next node not found:', nextNodeId);
            return null;
        }

        return this.getCurrentState();
    }

    getCurrentState() {
        const availableChoices = this.choices.get(this.currentNode.node_id) || [];
        
        return {
            node: this.currentNode,
            choices: availableChoices,
            history: [...this.history],
            isEnding: false
        };
    }

    getEnding(endingId) {
        return this.endings.find(e => e.id === endingId);
    }

    restart() {
        return this.startGame(this.startNodeId);
    }

    getStats() {
        return {
            nodesVisited: this.history.length,
            path: this.history
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CYOAEngine;
}