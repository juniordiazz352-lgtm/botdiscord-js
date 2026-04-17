const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

// ─── Config ───────────────────────────────────────────────────────────────────
const GUILD_ID  = "1466613977969852439";
const DUENO_ID  = "1272066173810380861";
const PREFIX    = "!";

const FILE = {
  DNI:        "data/dni.json",
  LICENCIA:   "data/licencia.json",
  VEHICULO:   "data/vehiculos.json",
  PATENTE:    "data/patentes.json",
  MODERACION: "data/moderacion.json",
  FORMULARIOS:"data/formularios.json",
  RESPUESTAS: "data/respuestas.json",
};

// ─── Helpers de datos ─────────────────────────────────────────────────────────
function cargar(archivo) {
  if (!fs.existsSync(archivo)) return {};
  try { return JSON.parse(fs.readFileSync(archivo, "utf-8")); }
  catch { return {}; }
}

function guardar(archivo, datos) {
  const dir = path.dirname(archivo);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify(datos, null, 2), "utf-8");
}

function getWarnData(userId, guildId) {
  const datos = cargar(FILE.MODERACION);
  return datos[`${guildId}_${userId}`] ?? { warns: [], banned: false };
}

function saveWarnData(userId, guildId, data) {
  const datos = cargar(FILE.MODERACION);
  datos[`${guildId}_${userId}`] = data;
  guardar(FILE.MODERACION, datos);
}

// ─── Cliente ──────────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// ─── Slash Commands ───────────────────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName("estadisticas")
    .setDescription("Muestra estadísticas del servidor"),

  new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Ver perfil de un usuario")
    .addUserOption(o => o.setName("usuario").setDescription("Usuario a ver")),

  new SlashCommandBuilder()
    .setName("roblox")
    .setDescription("Busca info de Roblox por nick de Discord")
    .addUserOption(o => o.setName("usuario").setDescription("Usuario de Discord").setRequired(true)),

  new SlashCommandBuilder()
    .setName("creardni")
    .setDescription("Crea tu DNI")
    .addStringOption(o => o.setName("nombre").setDescription("Nombre").setRequired(true))
    .addStringOption(o => o.setName("apellido").setDescription("Apellido").setRequired(true))
    .addStringOption(o => o.setName("fecha_nacimiento").setDescription("DD/MM/AAAA").setRequired(true))
    .addStringOption(o => o.setName("nacionalidad").setDescription("Nacionalidad").setRequired(true))
    .addStringOption(o => o.setName("profesion").setDescription("Profesión").setRequired(true))
    .addStringOption(o => o.setName("genero").setDescription("M/F/Otro").setRequired(true))
    .addStringOption(o => o.setName("altura").setDescription("Altura en cm").setRequired(true))
    .addStringOption(o => o.setName("peso").setDescription("Peso en kg").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ver-dni")
    .setDescription("Ver tu DNI"),

  new SlashCommandBuilder()
    .setName("eliminardni")
    .setDescription("Eliminar tu DNI"),

  new SlashCommandBuilder()
    .setName("crearlicencia")
    .setDescription("Crea tu licencia de conducir")
    .addStringOption(o => o.setName("nombre").setDescription("Nombre").setRequired(true))
    .addStringOption(o => o.setName("apellido").setDescription("Apellido").setRequired(true))
    .addStringOption(o => o.setName("fecha_nacimiento").setDescription("DD/MM/AAAA").setRequired(true))
    .addStringOption(o => o.setName("nacionalidad").setDescription("Nacionalidad").setRequired(true))
    .addStringOption(o => o.setName("genero").setDescription("M/F/Otro").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ver-licencia")
    .setDescription("Ver tu licencia"),

  new SlashCommandBuilder()
    .setName("eliminarlicencia")
    .setDescription("Eliminar tu licencia"),

  new SlashCommandBuilder()
    .setName("warns")
    .setDescription("Ver warns de un usuario")
    .addUserOption(o => o.setName("usuario").setDescription("Usuario")),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banear un usuario")
    .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true))
    .addStringOption(o => o.setName("razon").setDescription("Razón")),

  new SlashCommandBuilder()
    .setName("crearformulario")
    .setDescription("Crear un formulario (solo dueño)")
    .addStringOption(o => o.setName("nombre").setDescription("Nombre del formulario").setRequired(true))
    .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad de preguntas (1-10)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("borrarformulario")
    .setDescription("Borrar tu formulario (solo dueño)"),

  new SlashCommandBuilder()
    .setName("verrespuestas")
    .setDescription("Ver respuestas de tu formulario (solo dueño)"),
].map(c => c.toJSON());

// ─── Registrar comandos slash ─────────────────────────────────────────────────
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("Registrando comandos slash...");
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ Comandos registrados");
  } catch (err) {
    console.error("❌ Error registrando comandos:", err);
  }
}

// ─── Roblox helper ────────────────────────────────────────────────────────────
async function getRobloxDate(username) {
  try {
    const { data: userData } = await axios.get(`https://api.roblox.com/users/get-by-username?username=${username}`);
    if (!userData?.Id) return null;
    const { data: info } = await axios.get(`https://users.roblox.com/v1/users/${userData.Id}`);
    return info?.created ?? null;
  } catch { return null; }
}

// ─── Validar fecha DD/MM/AAAA ─────────────────────────────────────────────────
function validarFecha(str) {
  const [d, m, y] = str.split("/").map(Number);
  if (!d || !m || !y) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

// ─── Evento: ready ────────────────────────────────────────────────────────────
client.once("ready", async () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
  await registerCommands();
});

// ─── Prefixed commands (!say, !msg, !limpiar, !info, !registrarpatente, etc.) ─
client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith(PREFIX) || msg.author.bot) return;
  const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd  = args.shift().toLowerCase();

  // !say <mensaje>
  if (cmd === "say") {
    const texto = args.join(" ");
    if (!texto) return;
    await msg.delete().catch(() => {});
    const embed = new EmbedBuilder()
      .setTitle("Normativas del Servidor")
      .setDescription(texto)
      .setColor(0xF5F5DC)
      .setFooter({ text: "Creado por: Enzo" });
    await msg.channel.send({ embeds: [embed] });
  }

  // !msg <mensaje>
  if (cmd === "msg") {
    const texto = args.join(" ");
    if (!texto) return;
    await msg.delete().catch(() => {});
    await msg.channel.send(texto);
  }

  // !limpiar [cantidad]
  if (cmd === "limpiar") {
    const cantidad = Math.min(parseInt(args[0]) || 10, 100);
    const borrados = await msg.channel.bulkDelete(cantidad, true).catch(() => null);
    const embed = new EmbedBuilder()
      .setTitle("Mensajes eliminados")
      .setDescription(`Se eliminaron ${borrados?.size ?? 0} mensajes`)
      .setColor(0xFF0000);
    const m = await msg.channel.send({ embeds: [embed] });
    setTimeout(() => m.delete().catch(() => {}), 3000);
  }

  // !info
  if (cmd === "info") {
    const embed = new EmbedBuilder()
      .setTitle("Información")
      .setColor(0x0000FF)
      .addFields(
        { name: "Servidores", value: String(client.guilds.cache.size), inline: true },
        { name: "Latencia",   value: `${Math.round(client.ws.ping)}ms`, inline: true }
      );
    await msg.reply({ embeds: [embed] });
  }

  // !registrarpatente <nombre> <patente> <tipo>
  if (cmd === "registrarpatente") {
    if (args.length < 3) return msg.reply("Uso: !registrarpatente <nombre> <patente> <tipo>");
    const [nom, pat, tip] = args;
    const precios = { sedan: 450, coupe: 450, hatchback: 450, clasico: 450, motocicleta: 300, pickup: 550 };
    const pr = precios[tip.toLowerCase()] ?? 450;
    const d = cargar(FILE.PATENTE);
    d[msg.author.id] = { nombre: nom, patente: pat, tipo: tip, precio: pr };
    guardar(FILE.PATENTE, d);
    const embed = new EmbedBuilder()
      .setTitle("PATENTE REGISTRADA")
      .setColor(0x0000FF)
      .addFields(
        { name: "Propietario", value: nom,      inline: true },
        { name: "Patente",     value: pat,      inline: true },
        { name: "Tipo",        value: tip,      inline: true },
        { name: "Precio",      value: `$${pr}`, inline: true }
      );
    await msg.reply({ embeds: [embed] });
  }

  // !verpatente
  if (cmd === "verpatente") {
    const d = cargar(FILE.PATENTE)[msg.author.id];
    if (!d) return msg.reply("No tienes patente registrada");
    const embed = new EmbedBuilder()
      .setTitle("TU PATENTE")
      .setColor(0x0000FF)
      .addFields(
        { name: "Propietario", value: d.nombre,       inline: true },
        { name: "Patente",     value: d.patente,      inline: true },
        { name: "Tipo",        value: d.tipo,         inline: true },
        { name: "Precio",      value: `$${d.precio}`, inline: true }
      );
    await msg.reply({ embeds: [embed] });
  }

  // !registrarvehiculo <propietario> <marca> <año> <modelo> <tipo> <patente>
  if (cmd === "registrarvehiculo") {
    if (args.length < 6) return msg.reply("Uso: !registrarvehiculo <propietario> <marca> <año> <modelo> <tipo> <patente>");
    const [propietario, marca, año, modelo, tipo, patente] = args;
    const d = cargar(FILE.VEHICULO);
    d[msg.author.id] = { propietario, marca, año, modelo, tipo, patente };
    guardar(FILE.VEHICULO, d);
    const embed = new EmbedBuilder()
      .setTitle("VEHICULO REGISTRADO")
      .setColor(0x1E90FF)
      .addFields(
        { name: "Propietario", value: propietario, inline: true },
        { name: "Marca",       value: marca,       inline: true },
        { name: "Año",         value: año,         inline: true },
        { name: "Modelo",      value: modelo,      inline: true },
        { name: "Tipo",        value: tipo,        inline: true },
        { name: "Patente",     value: patente,     inline: true }
      );
    await msg.reply({ embeds: [embed] });
  }

  // !vervehiculo
  if (cmd === "vervehiculo") {
    const d = cargar(FILE.VEHICULO)[msg.author.id];
    if (!d) return msg.reply("No tienes vehículo registrado");
    const embed = new EmbedBuilder()
      .setTitle("TU VEHICULO")
      .setColor(0x1E90FF)
      .addFields(
        { name: "Propietario", value: d.propietario, inline: true },
        { name: "Marca",       value: d.marca,       inline: true },
        { name: "Año",         value: d.año,         inline: true },
        { name: "Modelo",      value: d.modelo,      inline: true },
        { name: "Tipo",        value: d.tipo,        inline: true },
        { name: "Patente",     value: d.patente,     inline: true }
      );
    await msg.reply({ embeds: [embed] });
  }
});

// ─── Slash command handler ────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, user, guild } = interaction;

  // /estadisticas
  if (commandName === "estadisticas") {
    const embed = new EmbedBuilder()
      .setTitle(`Estadísticas de ${guild.name}`)
      .setColor(0x0000FF)
      .setThumbnail(guild.iconURL() ?? null)
      .addFields(
        { name: "Miembros",  value: `Total: ${guild.memberCount}`,                                   inline: true },
        { name: "Canales",   value: `Texto: ${guild.channels.cache.filter(c => c.isTextBased()).size} | Voz: ${guild.channels.cache.filter(c => c.isVoiceBased()).size}`, inline: true },
        { name: "Roles",     value: String(guild.roles.cache.size), inline: true }
      );
    return interaction.reply({ embeds: [embed] });
  }

  // /perfil
  if (commandName === "perfil") {
    const target = interaction.options.getMember("usuario") ?? interaction.member;
    const member = target.user ?? target;
    const dni      = cargar(FILE.DNI)[member.id];
    const licencia = cargar(FILE.LICENCIA)[member.id];
    const vehiculo = cargar(FILE.VEHICULO)[member.id];
    const warns    = getWarnData(member.id, guild.id);
    const color    = target.displayColor || 0x0000FF;
    const embed = new EmbedBuilder()
      .setTitle(`Perfil de ${member.username}`)
      .setColor(color)
      .setThumbnail(member.displayAvatarURL())
      .addFields(
        { name: "ID",       value: member.id,                           inline: true },
        { name: "Creado",   value: member.createdAt.toLocaleDateString("es-AR"), inline: true },
        { name: "DNI",      value: dni      ? "✅" : "❌",              inline: true },
        { name: "Licencia", value: licencia ? "✅" : "❌",              inline: true },
        { name: "Vehículo", value: vehiculo ? "✅" : "❌",              inline: true },
        { name: "Warns",    value: `${warns.warns.length}/15`,          inline: true }
      );
    return interaction.reply({ embeds: [embed] });
  }

  // /roblox
  if (commandName === "roblox") {
    const target = interaction.options.getMember("usuario");
    const nombre = target.nickname ?? target.user.username;
    await interaction.reply(`🔍 Buscando info de Roblox para: **${nombre}**...`);
    const fecha = await getRobloxDate(nombre);
    if (fecha) {
      const fechaObj = new Date(fecha);
      const embed = new EmbedBuilder()
        .setTitle("Info de Roblox")
        .setDescription(`Usuario: **${nombre}**`)
        .setColor(0x0000FF)
        .addFields({ name: "Se unió a Roblox", value: fechaObj.toLocaleDateString("es-AR"), inline: true });
      await interaction.followUp({ embeds: [embed] });
    } else {
      await interaction.followUp(`❌ No se encontró info de Roblox para: **${nombre}**`);
    }
  }

  // /creardni
  if (commandName === "creardni") {
    const fechaNac = interaction.options.getString("fecha_nacimiento");
    if (!validarFecha(fechaNac)) return interaction.reply({ content: "❌ Fecha inválida. Usa DD/MM/AAAA", ephemeral: true });
    const datos = cargar(FILE.DNI);
    datos[user.id] = {
      nombre:           interaction.options.getString("nombre"),
      apellido:         interaction.options.getString("apellido"),
      fecha_nacimiento: fechaNac,
      nacionalidad:     interaction.options.getString("nacionalidad"),
      profesion:        interaction.options.getString("profesion"),
      genero:           interaction.options.getString("genero"),
      altura:           interaction.options.getString("altura"),
      peso:             interaction.options.getString("peso"),
    };
    guardar(FILE.DNI, datos);
    return interaction.reply({ content: "✅ DNI creado correctamente", ephemeral: true });
  }

  // /ver-dni
  if (commandName === "ver-dni") {
    const datos = cargar(FILE.DNI);
    if (!datos[user.id]) return interaction.reply({ content: "❌ No tienes DNI", ephemeral: true });
    const d = datos[user.id];
    const embed = new EmbedBuilder()
      .setTitle("🪪 TU DNI")
      .setColor(0xF5F5DC)
      .addFields(
        { name: "Nombre",       value: `${d.nombre} ${d.apellido}`, inline: true },
        { name: "Fecha Nac.",   value: d.fecha_nacimiento,           inline: true },
        { name: "Nacionalidad", value: d.nacionalidad,               inline: true },
        { name: "Profesión",    value: d.profesion,                  inline: true },
        { name: "Género",       value: d.genero,                     inline: true },
        { name: "Altura",       value: `${d.altura} cm`,             inline: true },
        { name: "Peso",         value: `${d.peso} kg`,               inline: true }
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // /eliminardni
  if (commandName === "eliminardni") {
    const datos = cargar(FILE.DNI);
    if (!datos[user.id]) return interaction.reply({ content: "❌ No tienes DNI", ephemeral: true });
    delete datos[user.id];
    guardar(FILE.DNI, datos);
    return interaction.reply({ content: "🗑️ DNI eliminado", ephemeral: true });
  }

  // /crearlicencia
  if (commandName === "crearlicencia") {
    const fechaNac = interaction.options.getString("fecha_nacimiento");
    if (!validarFecha(fechaNac)) return interaction.reply({ content: "❌ Fecha inválida", ephemeral: true });
    const emision    = new Date();
    const vencimiento = new Date(emision);
    vencimiento.setDate(vencimiento.getDate() + 30);
    const datos = cargar(FILE.LICENCIA);
    datos[user.id] = {
      nombre:           interaction.options.getString("nombre"),
      apellido:         interaction.options.getString("apellido"),
      fecha_nacimiento: fechaNac,
      nacionalidad:     interaction.options.getString("nacionalidad"),
      genero:           interaction.options.getString("genero"),
      fecha_emision:    emision.toISOString(),
      fecha_vencimiento: vencimiento.toISOString(),
    };
    guardar(FILE.LICENCIA, datos);
    return interaction.reply({ content: `✅ Licencia creada. Vence: **${vencimiento.toLocaleDateString("es-AR")}**`, ephemeral: true });
  }

  // /ver-licencia
  if (commandName === "ver-licencia") {
    const datos = cargar(FILE.LICENCIA);
    if (!datos[user.id]) return interaction.reply({ content: "❌ No tienes licencia", ephemeral: true });
    const l = datos[user.id];
    const fe = new Date(l.fecha_emision).toLocaleDateString("es-AR");
    const fv = new Date(l.fecha_vencimiento).toLocaleDateString("es-AR");
    const embed = new EmbedBuilder()
      .setTitle("🪪 TU LICENCIA")
      .setColor(0x1E90FF)
      .addFields(
        { name: "Nombre",      value: `${l.nombre} ${l.apellido}`, inline: true },
        { name: "Fecha Nac.",  value: l.fecha_nacimiento,           inline: true },
        { name: "Nacionalidad",value: l.nacionalidad,               inline: true },
        { name: "Género",      value: l.genero,                     inline: true },
        { name: "Emisión",     value: fe,                           inline: true },
        { name: "Vencimiento", value: fv,                           inline: true }
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // /eliminarlicencia
  if (commandName === "eliminarlicencia") {
    const datos = cargar(FILE.LICENCIA);
    if (!datos[user.id]) return interaction.reply({ content: "❌ No tienes licencia", ephemeral: true });
    delete datos[user.id];
    guardar(FILE.LICENCIA, datos);
    return interaction.reply({ content: "🗑️ Licencia eliminada", ephemeral: true });
  }

  // /warns
  if (commandName === "warns") {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply({ content: "❌ Sin permisos", ephemeral: true });
    const target = interaction.options.getMember("usuario") ?? interaction.member;
    const wd = getWarnData(target.user.id, guild.id);
    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warns de ${target.user.username}`)
      .setColor(0xFFA500)
      .addFields({ name: "Total", value: `${wd.warns.length}/15` });
    if (wd.warns.length > 0) {
      embed.addFields({ name: "Historial", value: wd.warns.map((w, i) => `${i + 1}. ${w.razon}`).join("\n") });
    } else {
      embed.addFields({ name: "Historial", value: "Sin warns" });
    }
    return interaction.reply({ embeds: [embed] });
  }

  // /ban
  if (commandName === "ban") {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply({ content: "❌ Sin permisos", ephemeral: true });
    const target = interaction.options.getMember("usuario");
    const razon  = interaction.options.getString("razon") ?? "Sin razón";
    await target.ban({ reason: razon });
    const embed = new EmbedBuilder()
      .setTitle("🔨 BANEADO")
      .setColor(0xFF0000)
      .addFields(
        { name: "Usuario", value: target.user.tag, inline: true },
        { name: "Razón",   value: razon,           inline: true }
      );
    return interaction.reply({ embeds: [embed] });
  }

  // /crearformulario
  if (commandName === "crearformulario") {
    if (user.id !== DUENO_ID)
      return interaction.reply({ content: "❌ Solo el dueño puede usar este comando", ephemeral: true });
    const nombre   = interaction.options.getString("nombre");
    const cantidad = interaction.options.getInteger("cantidad");
    if (cantidad < 1 || cantidad > 10)
      return interaction.reply({ content: "❌ La cantidad debe ser entre 1 y 10", ephemeral: true });

    const preguntas = [];
    const filter = m => m.author.id === user.id && m.channel.id === interaction.channel.id;

    await interaction.reply(`📝 Escribe la pregunta 1:`);
    try {
      for (let i = 1; i <= cantidad; i++) {
        if (i > 1) await interaction.followUp(`📝 Escribe la pregunta ${i}:`);
        const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60_000, errors: ["time"] });
        preguntas.push(collected.first().content);
      }
      const datos = cargar(FILE.FORMULARIOS);
      datos[user.id] = { nombre, preguntas, creado: new Date().toLocaleString("es-AR") };
      guardar(FILE.FORMULARIOS, datos);
      await interaction.followUp({ content: `✅ Formulario **${nombre}** creado con ${cantidad} preguntas`, ephemeral: true });
    } catch {
      await interaction.followUp({ content: "❌ Tiempo agotado", ephemeral: true });
    }
  }

  // /borrarformulario
  if (commandName === "borrarformulario") {
    if (user.id !== DUENO_ID)
      return interaction.reply({ content: "❌ Solo el dueño puede usar este comando", ephemeral: true });
    const datos = cargar(FILE.FORMULARIOS);
    if (!datos[user.id])
      return interaction.reply({ content: "❌ No tienes formularios", ephemeral: true });
    const nombre = datos[user.id].nombre;
    delete datos[user.id];
    guardar(FILE.FORMULARIOS, datos);
    return interaction.reply({ content: `✅ Formulario **${nombre}** eliminado`, ephemeral: true });
  }

  // /verrespuestas
  if (commandName === "verrespuestas") {
    if (user.id !== DUENO_ID)
      return interaction.reply({ content: "❌ Solo el dueño puede usar este comando", ephemeral: true });
    const datos = cargar(FILE.RESPUESTAS);
    if (!datos[user.id])
      return interaction.reply({ content: "❌ No tienes respuestas", ephemeral: true });
    const resp = datos[user.id];
    const embed = new EmbedBuilder()
      .setTitle(`📨 Respuesta de: ${resp.para}`)
      .setColor(0x0000FF)
      .addFields(
        { name: "Formulario", value: resp.formulario, inline: true },
        { name: "Fecha",      value: resp.fecha,      inline: true },
        ...resp.respuestas.map((r, i) => ({ name: `Respuesta ${i + 1}`, value: r, inline: false }))
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// ─── Keep-alive HTTP (necesario para Render) ──────────────────────────────────
const http = require("http");
http.createServer((_, res) => res.end("Bot activo ✅")).listen(process.env.PORT || 3000, () => {
  console.log("🌐 Keep-alive servidor activo");
});

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.TOKEN);
