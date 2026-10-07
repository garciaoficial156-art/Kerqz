/* ============ Kerqz — catálogo ============
   Para adicionar um produto, acrescenta uma linha em "raw".
   As imagens de cada produto ficam em:
   images/produtos/<slug-do-produto>/<slug-da-cor>-1.jpg   (principal, obrigatória)
   images/produtos/<slug-do-produto>/<slug-da-cor>-2.jpg   (aparece ao passar o rato; opcional)
   images/produtos/<slug-do-produto>/<slug-da-cor>-3.jpg e -4.jpg (galeria; opcionais)
   Ex.: images/produtos/kerqz-aero-runner/areia-1.jpg
   Abre images/LEIA-ME.txt para veres a lista completa de caminhos. */
(function () {
  const slug = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // [id, nome, categoria, género, desporto, preço, preço antigo (0 = sem desconto), etiqueta, cores [nome, hex], descrição, nota, nº avaliações]
  const raw = [
    [1, "Kerqz Aero Runner", "Calçado", "Homem", "Running", 68000, 0, "Novo", [["Areia", "#e8dcc8"], ["Grafite", "#3a3d42"], ["Azul", "#2f6fde"]], "Espuma reativa na entressola e cabedal respirável. Leve para o dia inteiro.", 4.8, 212],
    [2, "Kerqz Court Classic", "Calçado", "Unissexo", "Lifestyle", 59000, 0, "", [["Branco", "#f4f4f2"], ["Verde", "#2f7d5b"], ["Preto", "#26272b"]], "O ténis de courts de sempre, em pele macia e sola de borracha resistente.", 4.7, 158],
    [3, "Kerqz Trail Pro", "Calçado", "Homem", "Trail", 74000, 89000, "", [["Oliva", "#66704a"], ["Grafite", "#3a3d42"], ["Terracota", "#c4633f"]], "Sola com tacos profundos para terra, pedra e chuva. Proteção reforçada nos dedos.", 4.7, 96],
    [4, "Kerqz Pulse Feminino", "Calçado", "Mulher", "Running", 64000, 0, "Novo", [["Rosa", "#e7a5b4"], ["Branco", "#f4f4f2"], ["Lilás", "#a99bd6"]], "Amortecimento suave e ajuste sem costuras para corridas longas.", 4.9, 187],
    [5, "Kerqz Mini Kick", "Calçado", "Criança", "Lifestyle", 32000, 0, "", [["Azul", "#2f6fde"], ["Vermelho", "#d43f21"]], "Fecho de velcro e sola flexível para brincar sem parar.", 4.6, 64],
    [6, "Hoodie Essencial", "Casacos", "Unissexo", "Lifestyle", 42000, 0, "Mais vendido", [["Cinza", "#b9bcc2"], ["Preto", "#26272b"], ["Vinho", "#7a2e3b"]], "Felpa de 380 g com capuz duplo e bolso canguru.", 4.9, 341],
    [7, "Bomber Lisboa", "Casacos", "Homem", "Lifestyle", 89000, 0, "", [["Oliva", "#66704a"], ["Preto", "#26272b"], ["Marinho", "#23324f"]], "Bomber leve com forro em cetim e punhos canelados.", 4.6, 73],
    [8, "Puffer Leve", "Casacos", "Mulher", "Lifestyle", 115000, 138000, "", [["Azul-céu", "#8fb6e8"], ["Preto", "#26272b"], ["Areia", "#d9c9ab"]], "Enchimento térmico que dobra num bolso. Quente sem peso.", 4.8, 129],
    [9, "T-shirt Pima", "T-shirts", "Unissexo", "Lifestyle", 18500, 0, "", [["Branco", "#f4f4f2"], ["Preto", "#26272b"], ["Terracota", "#c4633f"], ["Céu", "#8fb6e8"]], "Algodão Pima penteado. Macio, fresco e não deforma.", 4.9, 402],
    [10, "T-shirt Treino Dry", "T-shirts", "Homem", "Treino", 21000, 0, "Novo", [["Preto", "#26272b"], ["Cinza", "#b9bcc2"], ["Azul", "#2f6fde"]], "Tecido que afasta o suor da pele e seca rapidamente.", 4.7, 118],
    [11, "Top Studio", "T-shirts", "Mulher", "Treino", 19500, 0, "", [["Preto", "#26272b"], ["Vinho", "#7a2e3b"], ["Rosa", "#e7a5b4"]], "Suporte médio e costas em tira para treinos intensos.", 4.8, 91],
    [12, "Calça Cargo", "Calças", "Homem", "Lifestyle", 48000, 0, "", [["Oliva", "#66704a"], ["Areia", "#d9c9ab"], ["Preto", "#26272b"]], "Sarja resistente, seis bolsos e perna direita.", 4.6, 84],
    [13, "Legging Studio", "Calças", "Mulher", "Treino", 36000, 45000, "", [["Preto", "#26272b"], ["Marinho", "#23324f"]], "Cintura alta que não desce e tecido opaco em qualquer movimento.", 4.9, 260],
    [14, "Boné Clássico", "Acessórios", "Unissexo", "Lifestyle", 12500, 0, "", [["Preto", "#26272b"], ["Branco", "#f4f4f2"], ["Vinho", "#7a2e3b"]], "Seis painéis, aba curva e fecho ajustável.", 4.8, 175],
    [15, "Mochila Urban", "Acessórios", "Unissexo", "Lifestyle", 27000, 0, "Novo", [["Preto", "#26272b"], ["Oliva", "#66704a"]], "22 litros, compartimento acolchoado para portátil e bolsos com fecho.", 4.7, 58]
  ];

  window.KERQZ = {
    slug,
    products: raw.map(([id, name, cat, gen, sport, price, old, badge, colors, desc, rating, reviews]) => ({
      id, name, cat, gen, sport, price, old, badge, desc, rating, reviews,
      slug: slug(name),
      colors: colors.map(([n, hex]) => ({ n, hex, slug: slug(n) }))
    }))
  };
})();
