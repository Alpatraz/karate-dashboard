import { useState, useEffect } from "react";

// --- petite fonction pour essayer de récupérer une image de la chaîne YouTube ---
// (via noembed.com, gratuit, sans clé API ; si ça échoue on garde l'icône par défaut)
async function fetchYoutubeAvatar(channelUrl) {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(channelUrl)}`
    );
    if (!res.ok) throw new Error("noembed error");
    const data = await res.json();
    // on utilise la miniature renvoyée (ce n'est pas toujours la vraie photo de profil,
    // mais ça donne au moins une image représentative de la chaîne)
    return data.thumbnail_url || null;
  } catch (e) {
    console.warn("Impossible de récupérer l’avatar YouTube :", e);
    return null;
  }
}

export default function VideoLibraryView() {
  const [videos, setVideos] = useState(() =>
    JSON.parse(localStorage.getItem("karate_videos") || "[]")
  );
  const [channels, setChannels] = useState(() =>
    JSON.parse(localStorage.getItem("karate_channels") || "[]")
  );

  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [newVideo, setNewVideo] = useState({
    url: "",
    titre: "",
    theme: "Autre",
  });
  const [newChannel, setNewChannel] = useState({
    url: "",
    titre: "",
    theme: "Autre",
  });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    localStorage.setItem("karate_videos", JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem("karate_channels", JSON.stringify(channels));
  }, [channels]);

  const themes = [
    "Tous",
    "Kata",
    "Kick",
    "Renforcement",
    "Armes",
    "Bloc",
    "Combat",
    "Autre",
  ];

  // === Ajout d'une vidéo ===
  const addVideo = () => {
    if (!newVideo.url || !newVideo.titre)
      return alert("Titre et URL requis");
    const v = { ...newVideo, favori: false, type: "single" };
    setVideos((prev) => [...prev, v]);
    setNewVideo({ url: "", titre: "", theme: "Autre" });
    setShowAddVideo(false);
  };

  // === Ajout d'une chaîne ===
  const addChannel = async () => {
    if (!newChannel.url || !newChannel.titre)
      return alert("Nom et URL requis");

    // tentative de récupération de l’avatar
    const avatarUrl =
      (await fetchYoutubeAvatar(newChannel.url)) ||
      "https://www.google.com/s2/favicons?domain=youtube.com&sz=64";

    const channel = {
      titre: newChannel.titre,
      url: newChannel.url,
      theme: newChannel.theme,
      avatar: avatarUrl,
    };
    setChannels((prev) => [...prev, channel]);

    // Simule quelques vidéos de la chaîne pour remplir la grille
    const mockVids = Array.from({ length: 5 }).map((_, i) => ({
      titre: `${newChannel.titre} — vidéo ${i + 1}`,
      url: newChannel.url,
      theme: newChannel.theme,
      favori: false,
      type: "channel",
      channel: newChannel.titre,
    }));

    setVideos((prev) => [...prev, ...mockVids]);

    setNewChannel({ url: "", titre: "", theme: "Autre" });
    setShowAddChannel(false);
  };

  const deleteVideo = (index) => {
    if (confirm("Supprimer cette vidéo ?")) {
      setVideos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const editVideo = (index, updated) => {
    const copy = [...videos];
    copy[index] = { ...copy[index], ...updated };
    setVideos(copy);
  };

  const extractEmbed = (url) => {
    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let id = "";
        if (url.includes("v=")) id = new URL(url).searchParams.get("v");
        else id = url.split("/").filter(Boolean).pop();
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes("tiktok.com"))
        return url.replace("www.", "www.tiktok.com/embed/");
      if (url.includes("facebook.com") || url.includes("fb.watch")) {
        const cleanUrl = encodeURIComponent(url);
        return `https://www.facebook.com/plugins/video.php?href=${cleanUrl}&show_text=false`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const canEmbed = (url) =>
    url.includes("youtube.com") || url.includes("youtu.be");

  const toggleFavori = (index) => {
    const copy = [...videos];
    copy[index].favori = !copy[index].favori;
    setVideos(copy);
  };

  // === Filtrage par thème / recherche / chaîne ===
  const filtrées = videos.filter((v) => {
    const matchTheme =
      filter === "Tous" || v.theme === filter || v.channel === filter;
    const matchSearch = v.titre
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchTheme && matchSearch;
  });

  return (
    <div className="flex h-full">
      {/* ======================== SIDEBAR ABONNEMENTS ======================== */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">📺</span>
          <h3 className="font-semibold text-gray-800">Abonnements</h3>
        </div>

        <button
          className={`w-full text-left px-3 py-2 rounded text-sm font-medium mb-1 ${
            filter === "Tous"
              ? "bg-red-100 text-red-700"
              : "hover:bg-gray-100 text-gray-700"
          }`}
          onClick={() => setFilter("Tous")}
        >
          Tous les thèmes
        </button>

        {channels.length === 0 && (
          <p className="text-gray-500 text-sm">
            Aucune chaîne suivie pour l’instant.
          </p>
        )}

        <div className="space-y-2">
          {channels.map((c, i) => (
            <button
              key={i}
              onClick={() => setFilter(c.titre)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded transition text-left ${
                filter === c.titre
                  ? "bg-white shadow-sm border border-red-200"
                  : "hover:bg-gray-100"
              }`}
            >
              <img
                src={
                  c.avatar ||
                  "https://www.google.com/s2/favicons?domain=youtube.com&sz=64"
                }
                alt={c.titre}
                className="w-8 h-8 rounded-full object-cover bg-black/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {c.titre}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {c.theme || "Tous"}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setShowAddChannel(true)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-900"
          >
            ➕ Ajouter une chaîne
          </button>
          <button
            onClick={() => setShowAddVideo(true)}
            className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
          >
            ➕ Ajouter une vidéo
          </button>
        </div>
      </aside>

      {/* ======================== CONTENU PRINCIPAL ======================== */}
      <main className="flex-1 p-6">
        {/* Titre */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🎬 Vidéos
          </h2>
        </div>

        {/* Filtres + Recherche */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white w-full sm:w-auto"
          >
            <option value="Tous">Tous les thèmes</option>
            {themes
              .filter((t) => t !== "Tous")
              .map((t) => (
                <option key={t}>{t}</option>
              ))}
          </select>

          <div className="flex-1 relative">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Rechercher une vidéo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded pl-8 pr-3 py-2 text-sm w-full"
            />
          </div>
        </div>

        {/* Grille façon Netflix */}
        {filtrées.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            Aucune vidéo trouvée.
          </p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtrées.map((v, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* actions */}
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEdit({ ...v, index: i });
                  }}
                  className="bg-yellow-400 text-white px-2 py-1 rounded text-xs hover:bg-yellow-500"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteVideo(i);
                  }}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                >
                  🗑️
                </button>
              </div>

              {/* thumbnail */}
              <div
                onClick={() => {
                  if (canEmbed(v.url)) setSelected(v);
                  else window.open(v.url, "_blank");
                }}
                className="aspect-video bg-black flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {canEmbed(v.url) ? (
                  <iframe
                    src={extractEmbed(v.url)}
                    title={v.titre}
                    className="w-full h-full object-cover"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="text-gray-200 text-sm text-center">
                    🌐 Vidéo externe
                    <br />
                    <span className="text-xs text-gray-400">
                      Clique pour ouvrir
                    </span>
                  </div>
                )}
              </div>

              {/* infos */}
              <div className="p-3">
                <h4 className="font-semibold text-sm text-gray-900 flex justify-between items-center mb-1">
                  <span className="line-clamp-2">{v.titre}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavori(i);
                    }}
                    className="ml-2"
                  >
                    {v.favori ? "⭐" : "☆"}
                  </button>
                </h4>
                <p className="text-xs text-gray-500">
                  {v.theme || "Autre"}
                </p>
                {v.channel && (
                  <button
                    type="button"
                    onClick={() => setFilter(v.channel)}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    Voir toutes les vidéos de {v.channel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ======================== Visionneuse plein écran ======================== */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 md:w-3/4 lg:w-1/2 relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-3 text-gray-600 hover:text-red-600"
            >
              ✖
            </button>
            <h3 className="font-bold text-red-600 mb-2">
              {selected.titre}
            </h3>
            <div className="aspect-video mb-3">
              <iframe
                src={extractEmbed(selected.url)}
                title={selected.titre}
                allowFullScreen
                className="w-full h-full rounded"
              ></iframe>
            </div>
            <p className="text-sm text-gray-500">{selected.theme}</p>
          </div>
        </div>
      )}

      {/* ======================== Pop-up : Ajouter / Modifier une vidéo ======================== */}
      {(showAddVideo || showEdit) && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg relative">
            <button
              onClick={() => {
                setShowEdit(null);
                setShowAddVideo(false);
              }}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-600"
            >
              ✖
            </button>

            <h3 className="text-lg font-bold mb-4 text-red-600">
              {showEdit ? "✏️ Modifier la vidéo" : "➕ Ajouter une vidéo"}
            </h3>

            <input
              type="text"
              placeholder="Titre"
              value={showEdit ? showEdit.titre : newVideo.titre}
              onChange={(e) =>
                showEdit
                  ? setShowEdit({ ...showEdit, titre: e.target.value })
                  : setNewVideo({ ...newVideo, titre: e.target.value })
              }
              className="border p-2 rounded w-full mb-2 text-sm"
            />
            <input
              type="text"
              placeholder="URL"
              value={showEdit ? showEdit.url : newVideo.url}
              onChange={(e) =>
                showEdit
                  ? setShowEdit({ ...showEdit, url: e.target.value })
                  : setNewVideo({ ...newVideo, url: e.target.value })
              }
              className="border p-2 rounded w-full mb-2 text-sm"
            />
            <select
              value={showEdit ? showEdit.theme : newVideo.theme}
              onChange={(e) =>
                showEdit
                  ? setShowEdit({ ...showEdit, theme: e.target.value })
                  : setNewVideo({ ...newVideo, theme: e.target.value })
              }
              className="border p-2 rounded w-full mb-4 text-sm bg-white"
            >
              {themes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEdit(null);
                  setShowAddVideo(false);
                }}
                className="px-4 py-2 text-sm text-gray-600"
              >
                Annuler
              </button>

              {showEdit ? (
                <button
                  onClick={() => {
                    editVideo(showEdit.index, showEdit);
                    setShowEdit(null);
                  }}
                  className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600"
                >
                  Sauvegarder
                </button>
              ) : (
                <button
                  onClick={addVideo}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  Ajouter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================== Pop-up : Ajouter une chaîne ======================== */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg relative">
            <button
              onClick={() => setShowAddChannel(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-600"
            >
              ✖
            </button>

            <h3 className="text-lg font-bold mb-4 text-red-600">
              📺 Ajouter une chaîne
            </h3>

            <input
              type="text"
              placeholder="Nom de la chaîne"
              value={newChannel.titre}
              onChange={(e) =>
                setNewChannel({ ...newChannel, titre: e.target.value })
              }
              className="border p-2 rounded w-full mb-2 text-sm"
            />
            <input
              type="text"
              placeholder="URL de la chaîne"
              value={newChannel.url}
              onChange={(e) =>
                setNewChannel({ ...newChannel, url: e.target.value })
              }
              className="border p-2 rounded w-full mb-2 text-sm"
            />
            <select
              value={newChannel.theme}
              onChange={(e) =>
                setNewChannel({ ...newChannel, theme: e.target.value })
              }
              className="border p-2 rounded w-full mb-4 text-sm bg-white"
            >
              {themes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddChannel(false)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={addChannel}
                className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
