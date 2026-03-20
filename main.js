// main.js - Core logic for RE/MAX website and AI Simulator

document.addEventListener('DOMContentLoaded', () => {

    /* =====================================
       AI Assistant Logic
       ===================================== */
    const aiFloatBtn = document.getElementById('ai-float-btn');
    const aiWidget = document.getElementById('ai-widget');
    const aiCloseBtn = document.getElementById('ai-close-btn');
    const aiChatBody = document.getElementById('ai-chat-body');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatSend = document.getElementById('ai-chat-send');

    // Main Hero Search
    const aiSearchInput = document.getElementById('ai-search-input');
    const aiSearchBtn = document.getElementById('ai-search-btn');

    // Add initial message
    function addInitialMessage() {
        if (document.querySelectorAll('.ai-message').length === 0) {
            sendMessage("Hello! / ¡Hola! I'm <strong>Alti</strong>, your personal AI agent for Costa Rica.<br><br>Do you prefer English or Español?", false);
        }
    }

    // Toggle Chat Widget
    function toggleChat() {
        if (aiWidget.classList.contains('closed')) {
            aiWidget.classList.remove('closed');
            aiChatInput.focus();
            addInitialMessage();
        } else {
            aiWidget.classList.add('closed');
        }
    }

    /* =====================================
       Search Mode Toggle Logic
       ===================================== */
    const toggleSearchModeBtn = document.getElementById('toggle-search-mode');
    const aiSearchPanel = document.getElementById('ai-search-panel');
    const traditionalSearchPanel = document.getElementById('traditional-search-panel');
    let isTraditionalSearch = false;

    if (toggleSearchModeBtn) {
        toggleSearchModeBtn.addEventListener('click', () => {
            isTraditionalSearch = !isTraditionalSearch;
            if (isTraditionalSearch) {
                aiSearchPanel.classList.add('hidden');
                traditionalSearchPanel.classList.remove('hidden');
                toggleSearchModeBtn.innerHTML = 'Smart Search <i class="fa-solid fa-wand-magic-sparkles"></i>';
            } else {
                aiSearchPanel.classList.remove('hidden');
                traditionalSearchPanel.classList.add('hidden');
                toggleSearchModeBtn.innerHTML = 'Traditional Search <i class="fa-solid fa-sliders"></i>';
            }
        });
    }

    // Area Unit Toggles
    const areaToggles = document.querySelectorAll('.area-toggles button');
    areaToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active class from siblings
            const siblings = btn.parentElement.querySelectorAll('button');
            siblings.forEach(s => s.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
        });
    });

    aiFloatBtn.addEventListener('click', toggleChat);
    aiCloseBtn.addEventListener('click', toggleChat);

    // Send Message
    function sendMessage(text, isUser = true) {
        if (!text.trim()) return;

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('ai-message');
        msgDiv.classList.add(isUser ? 'user' : 'ai');

        const p = document.createElement('p');
        p.innerHTML = text; // allow HTML for initial message bolding
        msgDiv.appendChild(p);

        aiChatBody.appendChild(msgDiv);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;

        if (isUser) {
            aiChatInput.value = '';
            simulateAIResponse(text);
        }
    }

    // Add Property Card to Chat
    function addPropertyCard(property) {
        const cardHtml = `
            <div class="chat-property-card">
                <div class="chat-property-img" style="background-image: url('${property.img}')"></div>
                <div class="chat-property-details">
                    <h4 class="price">${property.price}</h4>
                    <h4>${property.title}</h4>
                    <p style="font-size: 0.8rem; color: #888; margin-top: 5px;">
                        <i class="fa-solid fa-location-dot"></i> ${property.location}
                    </p>
                </div>
            </div>
        `;

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('ai-message', 'ai');
        msgDiv.innerHTML = cardHtml;

        aiChatBody.appendChild(msgDiv);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    }

    // Conversational State
    let conversationState = 'LANGUAGE';
    let leadData = { lang: 'en', name: '', email: '', phone: '', preference: '', intent: '' };

    function getStr(enStr, esStr) {
        return leadData.lang === 'es' ? esStr : enStr;
    }

    // Simulate AI Response based on state and keywords
    function simulateAIResponse(userText) {
        // Show Typing Indicator
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        aiChatBody.appendChild(typingDiv);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;

        const text = userText.toLowerCase();
        const thinkingTime = Math.random() * 1000 + 1000;

        setTimeout(() => {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();

            // 1. Language Detection
            if (conversationState === 'LANGUAGE') {
                if (text.includes('espanol') || text.includes('español') || text.includes('spanish')) {
                    leadData.lang = 'es';
                } else {
                    leadData.lang = 'en'; // default
                }

                sendMessage(getStr(
                    "Wonderful! To get started, may I have your name?",
                    "¡Excelente! Para comenzar, ¿podrías darme tu nombre?"
                ), false);
                conversationState = 'CAPTURE_NAME_FIRST';
                return;
            }

            // 2. Initial Name Capture
            if (conversationState === 'CAPTURE_NAME_FIRST') {
                if (userText.length > 2) {
                    leadData.name = userText;
                    let opts = getStr(
                        `<br><br>1. Buy<br>2. Sell<br>3. Rent<br>4. Learn about the market / How we work`,
                        `<br><br>1. Comprar<br>2. Vender<br>3. Alquilar<br>4. Aprender sobre el mercado / Cómo trabajamos`
                    );
                    sendMessage(getStr(
                        `It's a pleasure to meet you, ${leadData.name}. How can I assist you today? Please choose an option:` + opts,
                        `Es un placer conocerte, ${leadData.name}. ¿Cómo puedo ayudarte hoy? Por favor elige una opción:` + opts
                    ), false);
                    conversationState = 'MAIN_MENU';
                } else {
                    sendMessage(getStr("Please provide a valid name.", "Por favor, proporciona un nombre válido."), false);
                }
                return;
            }

            // 3. Main Menu Routing
            if (conversationState === 'MAIN_MENU') {
                if (text.includes('1') || text.includes('buy') || text.includes('comprar')) {
                    leadData.intent = 'BUY';
                    sendMessage(getStr(
                        "Exciting! Briefly, what kind of property are you envisioning? (e.g., A mountain retreat, ocean view villa, or raw land)",
                        "¡Emocionante! Brevemente, ¿qué tipo de propiedad tienes en mente? (ej. Un retiro en la montaña, villa con vista al mar, o lote libre)"
                    ), false);
                    conversationState = 'PROVIDE_INFO';
                } else if (text.includes('2') || text.includes('sell') || text.includes('vender')) {
                    leadData.intent = 'SELL';
                    sendMessage(getStr(
                        "We'd be honored to help list your property. Where is it located and what type of property is it?",
                        "Sería un honor ayudar a anunciar tu propiedad. ¿Dónde está ubicada y qué tipo de propiedad es?"
                    ), false);
                    conversationState = 'PROVIDE_INFO';
                } else if (text.includes('3') || text.includes('rent') || text.includes('alquilar')) {
                    leadData.intent = 'RENT';
                    sendMessage(getStr(
                        "We have several long-term luxury rentals available. Are you looking in the mountains or near the beach?",
                        "Tenemos varios alquileres de lujo a largo plazo. ¿Buscas en las montañas o cerca de la playa?"
                    ), false);
                    conversationState = 'PROVIDE_INFO';
                } else if (text.includes('4') || text.includes('learn') || text.includes('aprender')) {
                    leadData.intent = 'LEARN';
                    sendMessage(getStr(
                        "Costa Rica's market is dynamic! We operate in two main areas: Altitud (Pérez Zeledón mountains) and Altitud Cero (Dominical coast). Which area interests you more?",
                        "¡El mercado de Costa Rica es dinámico! Operamos en dos áreas principales: Altitud (montañas de Pérez Zeledón) y Altitud Cero (costa de Dominical). ¿Qué área te interesa más?"
                    ), false);
                    conversationState = 'PROVIDE_INFO';
                } else {
                    sendMessage(getStr(
                        "I didn't quite catch that. Please type Buy, Sell, Rent, or Learn.",
                        "No capté eso. Por favor escribe Comprar, Vender, Alquilar, o Aprender."
                    ), false);
                }
                return;
            }

            // 4. Provide Information & Continuous Interaction
            if (conversationState === 'PROVIDE_INFO') {
                leadData.preference = userText;

                // Simulated generic valuable response
                sendMessage(getStr(
                    `Thank you for that detail, ${leadData.name}. Costa Rica has incredible options fitting exactly what you described. We see excellent opportunities matching that criteria locally right now.<br><br><strong>Was this information helpful, or would you prefer to speak directly with a human agent?</strong>`,
                    `Gracias por ese detalle, ${leadData.name}. Costa Rica tiene opciones increíbles que encajan exactamente con lo que describiste. Vemos excelentes oportunidades con esos criterios localmente en este momento.<br><br><strong>¿Esta información te fue útil o prefieres hablar directamente con un agente humano?</strong>`
                ), false);

                conversationState = 'CHECK_HANDOFF';
                return;
            }

            // 5. Check if Handoff Needed
            if (conversationState === 'CHECK_HANDOFF') {
                if (text.includes('human') || text.includes('agent') || text.includes('agente') || text.includes('speak') || text.includes('hablar') || text.includes('no') || text.includes('prefer')) {
                    sendMessage(getStr(
                        "I completely understand. A local human expert can assist you much better with precise details. To connect you, what is the best phone number to reach you?",
                        "Lo entiendo completamente. Un experto local humano puede ayudarte mucho mejor con detalles precisos. Para conectarte, ¿cuál es el mejor número de teléfono para contactarte?"
                    ), false);
                    conversationState = 'HANDOFF_PHONE';
                } else {
                    sendMessage(getStr(
                        "I'm glad that helped! What else would you like to know?",
                        "¡Me alegra que haya sido útil! ¿Qué más te gustaría saber?"
                    ), false);
                    conversationState = 'PROVIDE_INFO'; // Loop back to providing info
                }
                return;
            }

            // 6. Handoff Protocol
            if (conversationState === 'HANDOFF_PHONE') {
                if (userText.length > 5) {
                    leadData.phone = userText;
                    sendMessage(getStr(
                        "Thank you. And finally, what is your email address?",
                        "Gracias. Y finalmente, ¿cuál es tu dirección de correo electrónico?"
                    ), false);
                    conversationState = 'HANDOFF_EMAIL';
                } else {
                    sendMessage(getStr("Please provide a valid phone number.", "Por favor, proporciona un número de teléfono válido."), false);
                }
                return;
            }

            if (conversationState === 'HANDOFF_EMAIL') {
                if (text.includes('@')) {
                    leadData.email = userText;

                    const waLink = "https://wa.me/50680000000"; // REPLACE WITH ACTUAL LINK

                    sendMessage(getStr(
                        `Thank you, ${leadData.name}. Here is the direct link to our office WhatsApp to speak with a human agent immediately: <br><br><a href="${waLink}" target="_blank" style="color:var(--remax-blue); font-weight:bold; text-decoration:underline;">Click Here to Open WhatsApp</a>`,
                        `Gracias, ${leadData.name}. Aquí tienes el enlace directo al WhatsApp de nuestra oficina para hablar con un agente humano de inmediato: <br><br><a href="${waLink}" target="_blank" style="color:var(--remax-blue); font-weight:bold; text-decoration:underline;">Haz clic aquí para abrir WhatsApp</a>`
                    ), false);

                    conversationState = 'LANGUAGE'; // Complete reset
                    leadData = { lang: 'en', name: '', email: '', phone: '', preference: '', intent: '' };
                } else {
                    sendMessage(getStr("Please provide a valid email address.", "Por favor, proporciona un correo electrónico válido."), false);
                }
                return;
            }

        }, thinkingTime);
    }

    // Event Listeners for Chat
    aiChatSend.addEventListener('click', () => {
        sendMessage(aiChatInput.value);
    });

    aiChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(aiChatInput.value);
        }
    });

    // Hero Search Event
    if (aiSearchBtn) {
        aiSearchBtn.addEventListener('click', () => {
            const query = aiSearchInput.value;
            if (query) {
                if (aiWidget.classList.contains('closed')) {
                    toggleChat();
                }
                sendMessage(query);
                aiSearchInput.value = '';
            }
        });

        aiSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                aiSearchBtn.click();
            }
        });
    }

});
