import { useState, useEffect } from "react";

export default function VideoLibraryView() {
  const [videos, setVideos] = useState(() =>
    JSON.parse(localStorage.getItem("karate_videos") || "[]")
  );
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState(""); // 🔍 recherche texte
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [newVideo, setNewVideo] = useState({ url: "", titre: "", theme: "Autre" });
  const [newChannel, setNewChannel] = useState({ url: "", titre: "", theme: "Autre" });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    localStorage.setItem("karate_videos", JSON.stringify(videos));
  }, [videos]);

  const themes = ["Tous", "Kata", "Kick", "Renforcement", "Armes", "Bloc", "Combat", "Autre"];

  const addVideo = () => {
    if (!newVideo.url || !newVideo.titre) return alert("Titre et URL requis");
    const v = { ...newVideo, favori: false, type: "single" };
    setVideos((prev) => [...prev, v]);
    setNewVideo({ url: "", titre: "", theme: "Autre" });
    setShowAddVideo(false);
  };

  const addChannel = () => {
    if (!newChannel.url || !newChannel.titre) return alert("Nom et URL requis");
    const mockVids = Array.from({ length: 5 }).map((_, i) => ({
      titre: `${newChannel.titre} — vidéo ${i + 1}`,
      url: newChannel.url,
      theme: newChannel.theme,
      favori: false,
      type: "channel",
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
      if (url.includes("tiktok.com")) return url.replace("www.", "www.tiktok.com/embed/");
      if (url.includes("facebook.com") || url.includes("fb.watch")) {
        const cleanUrl = encodeURIComponent(url);
        return `https://www.facebook.com/plugins/video.php?href=${cleanUrl}&show_text=false`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const canEmbed = (url) => url.includes("youtube.com") || url.includes("youtu.be");

  const toggleFavori = (index) => {
    const copy = [...videos];
    copy[index].favori = !copy[index].favori;
    setVideos(copy);
  };

  // === Filtrage combiné par thème et recherche ===
  const filtrées = videos.filter((v) => {
    const matchTheme = filter === "Tous" || v.theme === filter;
    const matchSearch = v.titre.toLowerCase().includes(search.toLowerCase());
    return matchTheme && matchSearch;
  });

  return (
    <div>
      {/* ======== Barre d’action ======== */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🎥 Bibliothèque vidéo</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddVideo(true)}
            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
          >
            ➕ Ajouter une vidéo
          </button>
          <button
            onClick={() => setShowAddChannel(true)}
            className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-800"
          >
            📺 Ajouter une chaîne
          </button>
        </div>
      </div>

      {/* ======== Filtres et recherche ======== */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto"
        >
          {themes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        {/* 🔍 Barre de recherche */}
        <input
          type="text"
          placeholder="🔍 Rechercher une vidéo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded flex-1"
        />
      </div>

      {/* ======== Liste de vidéos ======== */}
      {filtrées.length === 0 && (
        <p className="text-gray-500 text-center mt-10">
          Aucune vidéo trouvée.
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrées.map((v, i) => (
          <div
            key={i}
            className="bg-white border rounded shadow-sm hover:shadow-md transition overflow-hidden relative"
          >
            {/* Boutons modifier/supprimer */}
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => setShowEdit({ ...v, index: i })}
                className="bg-yellow-400 text-white px-2 py-1 rounded text-xs hover:bg-yellow-500"
              >
                ✏️
              </button>
              <button
                onClick={() => deleteVideo(i)}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
              >
                🗑️
              </button>
            </div>

            <div
              onClick={() => {
                if (canEmbed(v.url)) setSelected(v);
                else window.open(v.url, "_blank");
              }}
              className="aspect-video bg-gray-200 flex items-center justify-center cursor-pointer"
            >
              {canEmbed(v.url) ? (
                <iframe
                  src={extractEmbed(v.url)}
                  title={v.titre}
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-gray-400 text-sm text-center">
                  🌐 Vidéo externe<br />
                  <span className="text-xs text-gray-500">
                    Clique pour ouvrir
                  </span>
                </div>
              )}
            </div>

            <div className="p-3">
              <h4 className="font-semibold flex justify-between items-center mb-1">
                {v.titre}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavori(i);
                  }}
                >
                  {v.favori ? "⭐" : "☆"}
                </button>
              </h4>
              <p className="text-sm text-gray-600">{v.theme}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ======== Visionneuse ======== */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 md:w-3/4 lg:w-1/2 relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-3 text-gray-600 hover:text-red-600"
            >
              ✖
            </button>
            <h3 className="font-bold text-red-600 mb-2">{selected.titre}</h3>
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

      {/* ======== Pop-up : Ajouter / Modifier une vidéo ======== */}
      {(showAddVideo || showEdit) && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-3">
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
              className="border p-2 rounded w-full mb-2"
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
              className="border p-2 rounded w-full mb-2"
            />
            <select
              value={showEdit ? showEdit.theme : newVideo.theme}
              onChange={(e) =>
                showEdit
                  ? setShowEdit({ ...showEdit, theme: e.target.value })
                  : setNewVideo({ ...newVideo, theme: e.target.value })
              }
              className="border p-2 rounded w-full mb-4"
            >
              {themes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <div className="flex justify-between">
              {showEdit ? (
                <button
                  onClick={() => {
                    editVideo(showEdit.index, showEdit);
                    setShowEdit(null);
                  }}
                  className="bg-yellow-500 text-white px-4 py-2 rounded"
                >
                  Sauvegarder
                </button>
              ) : (
                <button
                  onClick={addVideo}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Ajouter
                </button>
              )}
              <button
                onClick={() => {
                  setShowEdit(null);
                  setShowAddVideo(false);
                }}
                className="text-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== Pop-up : Ajouter une chaîne ======== */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-3">📺 Ajouter une chaîne</h3>
            <input
              type="text"
              placeholder="Nom de la chaîne"
              value={newChannel.titre}
              onChange={(e) =>
                setNewChannel({ ...newChannel, titre: e.target.value })
              }
              className="border p-2 rounded w-full mb-2"
            />
            <input
              type="text"
              placeholder="URL de la chaîne"
              value={newChannel.url}
              onChange={(e) =>
                setNewChannel({ ...newChannel, url: e.target.value })
              }
              className="border p-2 rounded w-full mb-2"
            />
            <select
              value={newChannel.theme}
              onChange={(e) =>
                setNewChannel({ ...newChannel, theme: e.target.value })
              }
              className="border p-2 rounded w-full mb-4"
            >
              {themes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <div className="flex justify-between">
              <button
                onClick={addChannel}
                className="bg-gray-700 text-white px-4 py-2 rounded"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddChannel(false)}
                className="text-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
