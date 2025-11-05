/**
 * CYOA UI Manager
 * Handles rendering and user interaction
 * MODIFIED: Removed reflection questions display
 */

class CYOAUIManager {
    constructor(engine, containerId) {
        this.engine = engine;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }

        this.setupUI();
    }

    /**
     * Set up the UI structure
     */
    setupUI() {
        this.container.innerHTML = `
            <div class="cyoa-game">
                <!-- Main game area -->
                <div class="cyoa-main">
                    <!-- Illustration placeholder -->
                    <div class="cyoa-illustration">
                        <div class="cyoa-illustration-placeholder">
                            <span class="cyoa-illustration-text">Illustration</span>
                        </div>
                        <div class="cyoa-illustration-caption"></div>
                    </div>

                    <!-- Narrative content -->
                    <div class="cyoa-content">
                        <div class="cyoa-location"></div>
                        <div class="cyoa-narrative"></div>
                        <div class="cyoa-choices"></div>
                    </div>
                </div>

                <!-- Policy sidebar -->
                <div class="cyoa-sidebar">
                    <div class="cyoa-sidebar-content">
                        <h3>Policy Context</h3>
                        <div class="cyoa-policy-note"></div>
                        <div class="cyoa-policy-countries"></div>
                        <div class="cyoa-sources"></div>
                    </div>
                </div>
            </div>

            <!-- Ending overlay (hidden by default) -->
            <div class="cyoa-ending-overlay" style="display: none;">
                <div class="cyoa-ending-content">
                    <h2 class="cyoa-ending-title"></h2>
                    <div class="cyoa-ending-narrative"></div>
                    <div class="cyoa-ending-legal"></div>
                    <div class="cyoa-ending-policy"></div>
                    <div class="cyoa-ending-actions">
                        <button class="cyoa-btn cyoa-restart-btn">Play Again</button>
                        <button class="cyoa-btn cyoa-return-btn">Return to Site</button>
                    </div>
                </div>
            </div>
        `;

        // Get references to UI elements
        this.elements = {
            illustration: this.container.querySelector('.cyoa-illustration-placeholder'),
            illustrationCaption: this.container.querySelector('.cyoa-illustration-caption'),
            location: this.container.querySelector('.cyoa-location'),
            narrative: this.container.querySelector('.cyoa-narrative'),
            choices: this.container.querySelector('.cyoa-choices'),
            policyNote: this.container.querySelector('.cyoa-policy-note'),
            policyCountries: this.container.querySelector('.cyoa-policy-countries'),
            sources: this.container.querySelector('.cyoa-sources'),
            endingOverlay: this.container.querySelector('.cyoa-ending-overlay'),
            endingTitle: this.container.querySelector('.cyoa-ending-title'),
            endingNarrative: this.container.querySelector('.cyoa-ending-narrative'),
            endingLegal: this.container.querySelector('.cyoa-ending-legal'),
            endingPolicy: this.container.querySelector('.cyoa-ending-policy')
        };

        // Set up event listeners
        this.container.querySelector('.cyoa-restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        this.container.querySelector('.cyoa-return-btn').addEventListener('click', () => {
            // For testing, just restart. In production, this would navigate back to main site
            window.location.href = '/';
        });
    }

    /**
     * Render the current game state
     */
    render(state) {
        if (state.isEnding && state.ending) {
            this.renderEnding(state.ending);
            return;
        }

        const { node, choices } = state;

        // Update illustration
        this.elements.illustration.innerHTML = `<span class="cyoa-illustration-text">${node.image_hint || 'Illustration'}</span>`;
        this.elements.illustrationCaption.textContent = node.path_description || '';

        // Update location
        this.elements.location.textContent = node.location || '';

        // Update narrative
        this.elements.narrative.textContent = node.narrative_text || '';

        // Update choices
        this.renderChoices(choices);

        // Update policy sidebar
        this.renderPolicySidebar(node);

        // Hide ending overlay
        this.elements.endingOverlay.style.display = 'none';
    }

    /**
     * Render choice buttons
     */
    renderChoices(choices) {
        this.elements.choices.innerHTML = '';

        choices.forEach(choice => {
            const choiceDiv = document.createElement('div');
            choiceDiv.className = 'cyoa-choice';

            const button = document.createElement('button');
            button.className = 'cyoa-choice-btn';
            button.textContent = choice.choice_text;
            
            // Add tooltip if available
            if (choice.tooltip_info) {
                button.title = choice.tooltip_info;
                button.classList.add('has-tooltip');
            }

            button.addEventListener('click', () => {
                this.handleChoice(choice.choice_id, choice);
            });

            choiceDiv.appendChild(button);
            this.elements.choices.appendChild(choiceDiv);
        });
    }

    /**
     * Handle choice selection
     */
    handleChoice(choiceId, choice) {
        // Show explanation if available
        if (choice.choice_explanation) {
            const explanation = document.createElement('div');
            explanation.className = 'cyoa-choice-explanation';
            explanation.textContent = choice.choice_explanation;
            this.elements.choices.insertBefore(explanation, this.elements.choices.firstChild);
            
            // Brief pause to let user read explanation
            setTimeout(() => {
                const state = this.engine.makeChoice(choiceId);
                if (state) {
                    this.render(state);
                }
            }, 1500);
        } else {
            const state = this.engine.makeChoice(choiceId);
            if (state) {
                this.render(state);
            }
        }
    }

    /**
     * Render policy sidebar
     */
    renderPolicySidebar(node) {
        // Policy note
        if (node.policy_note) {
            this.elements.policyNote.textContent = node.policy_note;
        } else {
            this.elements.policyNote.textContent = '';
        }

        // Policy countries comparison
        if (node.policy_countries) {
            const countries = node.policy_countries.split(',').map(c => c.trim());
            let countriesHTML = '<h4>Countries:</h4><ul>';
            countries.forEach(country => {
                countriesHTML += `<li>${country}</li>`;
            });
            countriesHTML += '</ul>';
            this.elements.policyCountries.innerHTML = countriesHTML;
        } else {
            this.elements.policyCountries.innerHTML = '';
        }

        // Sources
        if (node.source_notes) {
            this.elements.sources.innerHTML = `<p class="cyoa-sources-text">${node.source_notes}</p>`;
        } else {
            this.elements.sources.innerHTML = '';
        }
    }

    /**
     * Render ending screen
     */
    renderEnding(ending) {
        // Title
        this.elements.endingTitle.textContent = ending.title || 'Ending';

        // Narrative
        this.elements.endingNarrative.textContent = ending.narrative || '';

        // Legal information
        if (ending.legal_info) {
            let legalHTML = `
                <div class="cyoa-ending-section">
                    <h3>${ending.legal_info.title || 'Legal Context'}</h3>
                    <p>${ending.legal_info.text || ''}</p>
                </div>
            `;
            this.elements.endingLegal.innerHTML = legalHTML;
        } else {
            this.elements.endingLegal.innerHTML = '';
        }

        // Policy comparison
        if (ending.policy_comparison && ending.policy_comparison.countries) {
            let policyHTML = `
                <div class="cyoa-ending-section">
                    <h3>Policy Comparison</h3>
                    <div class="cyoa-policy-grid">
            `;

            ending.policy_comparison.countries.forEach(country => {
                policyHTML += `
                    <div class="cyoa-country-card">
                        <h4>${country.name}</h4>
                        <p><strong>Policy:</strong> ${country.policy}</p>
                        <p><strong>Penalty:</strong> ${country.penalty}</p>
                    </div>
                `;
            });

            policyHTML += `</div></div>`;
            this.elements.endingPolicy.innerHTML = policyHTML;
        } else {
            this.elements.endingPolicy.innerHTML = '';
        }

        // Show ending overlay
        this.elements.endingOverlay.style.display = 'flex';
    }

    /**
     * Start the game
     */
    startGame() {
        const state = this.engine.startGame();
        if (state) {
            this.render(state);
        }
    }

    /**
     * Restart the game
     */
    restartGame() {
        const state = this.engine.restart();
        if (state) {
            this.render(state);
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CYOAUIManager;
}