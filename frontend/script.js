
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const chatMessages = document.getElementById("chat-messages");
const newChatButton = document.querySelector(".new-chat");

const API_URL = "https://arolab-ai-backend.onrender.com/chat";


/* Create and display a chat message */

function createMessage(role, content) {
    const message = document.createElement("div");

    message.classList.add("message", `message-${role}`);

    const header = document.createElement("div");
    header.classList.add("message-header");

    const label = document.createElement("span");
    label.textContent = role === "user" ? "You" : "Arolab AI";

    const paragraph = document.createElement("p");
    paragraph.classList.add("message-text");

    // textContent prevents HTML from being executed.
    paragraph.textContent = content;

    header.appendChild(label);
    message.appendChild(header);
    message.appendChild(paragraph);

    chatMessages.appendChild(message);

    scrollToLatest();

    return message;
}


/* Automatically scroll to the latest message */

function scrollToLatest() {
    const chatContent = document.querySelector(".chat-content");

    chatContent.scrollTo({
        top: chatContent.scrollHeight,
        behavior: "smooth"
    });
}


/* Display the typing animation */

function showTypingIndicator() {
    const indicator = document.createElement("div");

    indicator.classList.add("typing-indicator");
    indicator.id = "typing-indicator";

    const label = document.createElement("span");
    label.textContent = "Arolab AI is thinking";

    const dots = document.createElement("div");
    dots.classList.add("typing-dots");

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("span");
        dots.appendChild(dot);
    }

    indicator.appendChild(label);
    indicator.appendChild(dots);

    chatMessages.appendChild(indicator);

    scrollToLatest();

    return indicator;
}


/* Remove the typing animation */

function removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");

    if (indicator) {
        indicator.remove();
    }
}


/* Send a message to the backend */

chatForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const message = userInput.value.trim();

    if (!message) {
        return;
    }

    // Display the user's message.
    createMessage("user", message);

    userInput.value = "";

    // Display loading feedback.
    sendButton.disabled = true;
    sendButton.textContent = "Thinking...";
    userInput.disabled = true;

    const typingIndicator = showTypingIndicator();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response.ok) {
            throw new Error("The server could not process your message.");
        }

        const data = await response.json();

        if (!data.assistant_reply) {
            throw new Error("The assistant returned an empty response.");
        }

        removeTypingIndicator();

        // Display Gemini's response.
        createMessage("assistant", data.assistant_reply);

    } catch (error) {
        removeTypingIndicator();

        createMessage(
            "assistant",
            "I could not process your message. Please check your connection and try again."
        );

        console.error("Chat error:", error);

    } finally {
        sendButton.disabled = false;
        sendButton.textContent = "Send";
        userInput.disabled = false;
        userInput.focus();
    }
});


/* Start a fresh conversation */

newChatButton.addEventListener("click", function () {
    chatMessages.replaceChildren();

    userInput.value = "";
    userInput.focus();

    scrollToLatest();
});
