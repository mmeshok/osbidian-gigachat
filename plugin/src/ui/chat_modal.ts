import { GigachatClient } from "data/gigachat_client";
import { RoadmapUsecase } from "data/roadmap_usecase";
import { TermsUsecase } from "data/terms_usecase";
import { App, MarkdownRenderer, MarkdownView, Modal, Notice } from "obsidian";

export class ChatModal extends Modal {
    prompt_text: string;
    prompt_table: { [key: string]: any }[] = [];
    client: GigachatClient;
    is_generating_answer: boolean;
    roadMapUseCase: RoadmapUsecase;
    termsUseCase: TermsUsecase

    constructor(app: App, client: GigachatClient, roadMapUseCase: RoadmapUsecase, termsUseCase: TermsUsecase) {
        super(app);
        this.client = client;
        this.is_generating_answer = false;
        this.roadMapUseCase = roadMapUseCase;
        this.termsUseCase = termsUseCase;
    }

    clearModalContent() {
        this.contentEl.innerHTML = "";
        this.prompt_text = "";
    }

    send_action = async () => {
        if (this.prompt_text && !this.is_generating_answer) {
            this.is_generating_answer = true;
            const prompt = {
                role: "user",
                content: this.prompt_text,
            };

            this.prompt_table.push(prompt, {
                role: "assistant",
            });

            this.clearModalContent();
            await this.displayModalContent();

            this.prompt_table.pop();
            const answers =
                this.modalEl.getElementsByClassName("chat-div assistant");
            const view = this.app.workspace.getActiveViewOfType(
                MarkdownView
            ) as MarkdownView;
            
            const answer = await this.client.chatRequest(this.prompt_table);
            if (answer) { 
                this.prompt_table.push({
                    role: "assistant",
                    content: answer.result,
                });            
            } else {
                new Notice("Ошибка при обработке запроса на сервере")
            }

            this.clearModalContent();
            await this.displayModalContent();
            this.is_generating_answer = false;
        }
    };

    displayModalContent = async () => {
        const { contentEl } = this;
        const container = this.contentEl.createEl("div", {
            cls: "chat-modal-container",
        });
        const view = this.app.workspace.getActiveViewOfType(
            MarkdownView
        ) as MarkdownView;

        for (const x of this.prompt_table) {
            const div = container.createEl("div", {
                cls: `chat-div ${x["role"]}`,
            });
            if (x["role"] === "assistant") {
                if (x["content"] != undefined) {
                    await MarkdownRenderer.render(this.app,
                        "Ассистент: " + x["content"],
                        div,
                        "",
                        view
                    );
                }
            } else {
                if (Array.isArray(x["content"])) {
                    const content = x["content"][0];
                    if (content["type"] === "text") {
                        div.createEl("p", {
                            text: content["text"],
                        });
                    }
                } else {
                    div.createEl("p", {
                        text: "Пользователь: " + x["content"],
                    });
                }
            }

            div.addEventListener("click", async () => {
                await navigator.clipboard.writeText(x["content"]);
                new Notice(x["content"] + " Copied to clipboard!");
            });
        }

        const button_container = contentEl.createEl("div", {
            cls: "chat-button-container",
        });

        button_container.createEl("p", {
            text: "Ввод запроса:",
        });

        const right_button_container = button_container.createEl("div", {
            cls: "chat-button-container-right",
        });

        const input_field = right_button_container.createEl("input", {
            placeholder: "Ваш вопрос",
            type: "text",
        });
        input_field.addEventListener("keypress", (evt) => {
            if (evt.key === "Enter") {
                this.prompt_text = input_field.value.trim();
                this.send_action();
            }
        });

        const submit_btn = right_button_container.createEl("button", {
            text: "Отправить",
            cls: "mod-cta",
        });
        submit_btn.addEventListener("click", () => {
            this.prompt_text = input_field.value.trim();
            this.send_action();
        });

        input_field.focus();
        input_field.select();

        const button_container_2 = contentEl.createEl("div", {
            cls: "chat-button-container-right upper-border",
        });

        const clear_button = button_container_2.createEl("button", {
            text: "Очистить",
        });
        const copy_button = button_container_2.createEl("button", {
            text: "Скопировать",
        });
        const roadmap_button = button_container_2.createEl("button", {
            text: "Создать Roadmap",
        });
        const terms_button = button_container_2.createEl("button", {
            text: "Обработать термины",
        });

        clear_button.addEventListener("click", () => {
            this.prompt_table = [];
            this.clearModalContent();
            this.displayModalContent();
            new Notice("История диалога очищена");
        });
        copy_button.addEventListener("click", async () => {
            const conversation = this.prompt_table
                .map((x) => x["content"])
                .join("\n\n");
            await navigator.clipboard.writeText(conversation);
            new Notice("Ответ скопирован в буфер обмена");
        });
        roadmap_button.addEventListener("click", async () => {
            const value = input_field.value.trim();
            if (value != "" && value != undefined) {
                new Notice("Создание Roadmap");
                await this.roadMapUseCase.execute(value);
                new Notice("Завершение создания Roadmap")
                this.close()
            } else {
                new Notice("Введите запрос для создания Roadmap");
            }
        });
        terms_button.addEventListener("click", () => {
            this.termsUseCase.execute();
        });        
    }

    onOpen() {
        this.titleEl.setText("Чем могу помочь?");
        this.displayModalContent();
    }

    onClose() {
        this.contentEl.empty();
    }
}
