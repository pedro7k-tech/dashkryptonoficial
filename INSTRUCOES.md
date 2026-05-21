# Como integrar o Dashboard com o seu site

O seu Dashboard local foi criado com sucesso! Para que ele comece a receber as informações (leads) do site que está no ar (`cadastrokrypton.vercel.app`), você precisa modificar o arquivo `script.js` do seu site e enviá-lo para a Vercel novamente.

## 1. Inicie o Servidor do Dashboard
Antes de mais nada, abra o terminal na pasta `DASH KRYPTON` e execute o comando:
```bash
node server.js
```
O seu painel estará disponível no navegador em: **http://localhost:3000**

## 2. Atualize o `script.js` do seu Site

Vá até o código fonte do seu site (o código que foi subido para a Vercel) e abra o arquivo `script.js`.

Procure pela parte onde diz `// Simulação de envio` dentro do evento `form.addEventListener('submit', ...)`.
**Substitua** todo o conteúdo do `form.addEventListener('submit', ...)` por este código abaixo:

```javascript
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.querySelector('.submit-btn');
        const originalText = btn.innerText;
        btn.innerText = 'Enviando...';
        btn.style.opacity = '0.7';

        // Captura os dados preenchidos
        const leadData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            device: document.getElementById('device').value,
            service_type: document.querySelector('input[name="service_type"]:checked').value
        };

        try {
            // Mude esta URL para a URL do seu servidor de dashboard quando ele estiver online!
            // Para testes locais, use 'http://localhost:3000/api/leads'
            const response = await fetch('http://localhost:3000/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leadData)
            });

            if (response.ok) {
                // Sucesso: Esconde o formulário e mostra a tela de sucesso
                const firstName = leadData.name.split(' ')[0];
                document.getElementById('user-name-display').innerText = firstName;
                
                formContainer.style.opacity = '0';
                setTimeout(() => {
                    formContainer.style.display = 'none';
                    successSection.style.display = 'block';
                    // Pequeno delay para a animação de entrada
                    setTimeout(() => {
                        successSection.style.opacity = '1';
                        successSection.style.transform = 'translateY(0)';
                    }, 50);
                }, 300);
            } else {
                alert("Erro ao enviar a solicitação. Tente novamente.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão ao enviar. Verifique se o painel está rodando.");
        } finally {
            btn.innerText = originalText;
            btn.style.opacity = '1';
        }
    });
```

> **Atenção:** Como o painel está rodando na sua máquina local, o `fetch` aponta para `http://localhost:3000`. Se o seu site na Vercel for acessado de outro computador ou celular, o envio não vai funcionar porque o celular não enxerga o seu `localhost`. 
> 
> Para um sistema 100% online, você precisará hospedar a pasta `DASH KRYPTON` em um servidor (como Render, Railway ou Heroku) e trocar o endereço `http://localhost:3000/api/leads` pelo link gerado por eles!
