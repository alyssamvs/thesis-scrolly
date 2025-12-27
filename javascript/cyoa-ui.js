

class CYOAUIManager {
    constructor(engine, containerId) {
        this.engine = engine;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }

        this.sidebarCollapsed = false;
        this.setupUI();
    }


    setupUI() {
        this.container.innerHTML = `
            <div class="cyoa-game">
                <!-- Main game area with background image -->
                <div class="cyoa-main">
                    <div class="cyoa-content">
                        <!-- Node text box -->
                        <div class="cyoa-node-box">
                            <div class="cyoa-location"></div>
                            <div class="cyoa-narrative"></div>
                        </div>

                        <!-- Choices -->
                        <div class="cyoa-choices"></div>
                    </div>
                </div>

                <!-- Collapsible policy sidebar -->
                <div class="cyoa-sidebar">
                    <button class="cyoa-sidebar-toggle" title="Toggle sidebar">≪</button>
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

        // UI elements
        this.elements = {
            main: this.container.querySelector('.cyoa-main'),
            location: this.container.querySelector('.cyoa-location'),
            narrative: this.container.querySelector('.cyoa-narrative'),
            choices: this.container.querySelector('.cyoa-choices'),
            sidebar: this.container.querySelector('.cyoa-sidebar'),
            sidebarToggle: this.container.querySelector('.cyoa-sidebar-toggle'),
            policyNote: this.container.querySelector('.cyoa-policy-note'),
            policyCountries: this.container.querySelector('.cyoa-policy-countries'),
            sources: this.container.querySelector('.cyoa-sources'),
            endingOverlay: this.container.querySelector('.cyoa-ending-overlay'),
            endingTitle: this.container.querySelector('.cyoa-ending-title'),
            endingNarrative: this.container.querySelector('.cyoa-ending-narrative'),
            endingLegal: this.container.querySelector('.cyoa-ending-legal'),
            endingPolicy: this.container.querySelector('.cyoa-ending-policy'),
            restartBtn: this.container.querySelector('.cyoa-restart-btn'),
            returnBtn: this.container.querySelector('.cyoa-return-btn')
        };

        // event listeners
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }

    /**
     * sidebar
     */
    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        
        if (this.sidebarCollapsed) {
            this.elements.sidebar.classList.add('collapsed');
            this.elements.sidebarToggle.textContent = '≫';
            this.elements.sidebarToggle.title = 'Expand sidebar';
        } else {
            this.elements.sidebar.classList.remove('collapsed');
            this.elements.sidebarToggle.textContent = '≪';
            this.elements.sidebarToggle.title = 'Collapse sidebar';
        }
    }

    /**
     * current game state
     */
    render(state) {
        if (!state) {
            console.error('No state to render');
            return;
        }

        // ending
        if (state.ending) {
            this.renderEnding(state.ending);
            return;
        }

        // Hide ending
        this.elements.endingOverlay.style.display = 'none';

        // Update background image if available
        if (state.node.image_hint) {
            this.elements.main.style.backgroundImage = `url('./assets/${state.node.image_hint}.jpg')`;
        }

        // Update location
        if (state.node.location) {
            this.elements.location.textContent = state.node.location;
            this.elements.location.style.display = 'block';
        } else {
            this.elements.location.style.display = 'none';
        }

        // Update narrative
        this.elements.narrative.textContent = state.node.narrative_text || '';

        // Render choices
        this.renderChoices(state.choices);

        // Update policy sidebar
        this.renderPolicySidebar(state.node);
    }

 
    renderChoices(choices) {
        if (!choices || choices.length === 0) {
            this.elements.choices.innerHTML = '<p>No choices available</p>';
            return;
        }

        this.elements.choices.innerHTML = '';

  
        if (choices.length === 2) {
            this.elements.choices.className = 'cyoa-choices two-options';
        } else {
            this.elements.choices.className = 'cyoa-choices multiple-options';
        }

        choices.forEach((choice, index) => {
            const choiceCard = document.createElement('div');
            choiceCard.className = 'cyoa-choice-card';
            
        
            let choiceHTML = `
                <div class="cyoa-choice-header">
                    <div class="cyoa-choice-text">${choice.choice_text}</div>
            `;

            // info button
            if (choice.choice_explanation || choice.tooltip_info) {
                choiceHTML += `
                    <button class="cyoa-info-btn" data-index="${index}" type="button">i</button>
                `;
            }

            choiceHTML += `</div>`;

            
            if (choice.choice_explanation || choice.tooltip_info) {
                choiceHTML += `
                    <div class="cyoa-choice-info" data-index="${index}">
                `;
                
                if (choice.choice_explanation) {
                    choiceHTML += `
                        <div class="cyoa-choice-explanation">${choice.choice_explanation}</div>
                    `;
                }

                if (choice.tooltip_info) {
                    choiceHTML += `
                        <div class="cyoa-choice-tooltip">${choice.tooltip_info}</div>
                    `;
                }

                choiceHTML += `</div>`;
            }

            choiceCard.innerHTML = choiceHTML;

     
            const infoBtn = choiceCard.querySelector('.cyoa-info-btn');
            if (infoBtn) {
                infoBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    this.toggleChoiceInfo(index);
                });
            }

         
            choiceCard.addEventListener('click', () => this.handleChoice(choice));

            this.elements.choices.appendChild(choiceCard);
        });
    }


    toggleChoiceInfo(index) {
        const infoSection = this.elements.choices.querySelector(`.cyoa-choice-info[data-index="${index}"]`);
        if (infoSection) {
            infoSection.classList.toggle('expanded');
        }
    }


    renderPolicySidebar(node) {
        // Policy note
        if (node.policy_note) {
            this.elements.policyNote.innerHTML = `
                <h4>Policy Overview</h4>
                <p>${node.policy_note}</p>
            `;
        } else {
            this.elements.policyNote.innerHTML = '';
        }

        // Policy countries
        if (node.policy_countries) {
            this.elements.policyCountries.innerHTML = `
                <h4>Countries</h4>
                <p>${node.policy_countries}</p>
            `;
        } else {
            this.elements.policyCountries.innerHTML = '';
        }

        // Sources
        if (node.source_notes) {
            this.elements.sources.innerHTML = `
                <h4>Sources</h4>
                <p>${node.source_notes}</p>
            `;
        } else {
            this.elements.sources.innerHTML = '';
        }
    }


    handleChoice(choice) {
        const state = this.engine.makeChoice(choice.choice_id);
        
        if (!state) {
            console.error('Failed to make choice');
            return;
        }


        setTimeout(() => {
            this.render(state);
        }, 300);
    }


    renderEnding(ending) {
      
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
                    <h3>Policy Comparison</h3>
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


        this.elements.endingOverlay.style.display = 'flex';
    }


    startGame() {
        const state = this.engine.startGame();
        if (state) {
            this.render(state);
        }
    }


    restartGame() {
        const state = this.engine.restart();
        if (state) {
            this.render(state);
        }
    }
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = CYOAUIManager;
}