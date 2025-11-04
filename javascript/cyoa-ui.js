/**
 * CYOA UI Manager
 * Handles rendering and user interaction
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
                    <div class="cyoa-ending-reflection"></div>
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
            endingPolicy: this.container.querySelector('.cyoa-ending-policy'),
            endingReflection: this.container.querySelector('.cyoa-ending-reflection')
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

            // Add click handler
            button.addEventListener('click', () => {
                this.handleChoice(choice);
            });

            choiceDiv.appendChild(button);

            // Add explanation below button (optional, can be shown on hover)
            if (choice.choice_explanation) {
                const explanation = document.createElement('div');
                explanation.className = 'cyoa-choice-explanation';
                explanation.textContent = choice.choice_explanation;
                choiceDiv.appendChild(explanation);
            }

            this.elements.choices.appendChild(choiceDiv);
        });
    }

    /**
     * Render policy sidebar
     */
    renderPolicySidebar(node) {
        // Policy note
        if (node.policy_note) {
            this.elements.policyNote.innerHTML = `<p>${node.policy_note}</p>`;
        } else {
            this.elements.policyNote.innerHTML = '';
        }

        // Policy countries
        if (node.policy_countries) {
            const countries = node.policy_countries.split(',').map(c => c.trim());
            this.elements.policyCountries.innerHTML = `
                <div class="cyoa-policy-countries-list">
                    <strong>Countries:</strong> ${countries.join(', ')}
                </div>
            `;
        } else {
            this.elements.policyCountries.innerHTML = '';
        }

        // Sources
        if (node.source_notes) {
            this.elements.sources.innerHTML = `
                <div class="cyoa-sources-list">
                    <strong>Sources:</strong>
                    <p class="cyoa-source-text">${node.source_notes}</p>
                </div>
            `;
        } else {
            this.elements.sources.innerHTML = '';
        }
    }

    /**
     * Handle choice selection
     */
    handleChoice(choice) {
        // Show choice explanation briefly before transitioning
        const state = this.engine.makeChoice(choice.choice_id);
        
        if (!state) {
            console.error('Failed to make choice');
            return;
        }

        // Small delay for better UX
        setTimeout(() => {
            this.render(state);
        }, 300);
    }

    /**
     * Render ending screen
     */
    renderEnding(ending) {
        // Fill in ending content
        this.elements.endingTitle.textContent = ending.title || 'The End';
        this.elements.endingNarrative.textContent = ending.narrative || '';

        // Legal info
        if (ending.legal_info) {
            this.elements.endingLegal.innerHTML = `
                <div class="cyoa-ending-section">
                    <h3>${ending.legal_info.title}</h3>
                    <p>${ending.legal_info.text}</p>
                </div>
            `;
        } else {
            this.elements.endingLegal.innerHTML = '';
        }

        // Policy comparison
        if (ending.policy_comparison) {
            let policyHTML = `
                <div class="cyoa-ending-section">
                    <h3>${ending.policy_comparison.title}</h3>
            `;

            ending.policy_comparison.countries.forEach(country => {
                policyHTML += `
                    <div class="cyoa-policy-country">
                        <h4>${country.name}</h4>
                        <p><strong>Policy:</strong> ${country.policy}</p>
                        <p><strong>Penalty:</strong> ${country.penalty}</p>
                    </div>
                `;
            });

            policyHTML += `</div>`;
            this.elements.endingPolicy.innerHTML = policyHTML;
        } else {
            this.elements.endingPolicy.innerHTML = '';
        }

        // Reflection questions
        if (ending.reflection_questions && ending.reflection_questions.length > 0) {
            let reflectionHTML = `
                <div class="cyoa-ending-section">
                    <h3>Reflection Questions</h3>
                    <ul class="cyoa-reflection-list">
            `;

            ending.reflection_questions.forEach(question => {
                reflectionHTML += `<li>${question}</li>`;
            });

            reflectionHTML += `</ul></div>`;
            this.elements.endingReflection.innerHTML = reflectionHTML;
        } else {
            this.elements.endingReflection.innerHTML = '';
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