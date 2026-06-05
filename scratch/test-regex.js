function extractYoutubeVideoId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/i,
  );
  return match ? match[1] : null;
}

const urls = [
  'https://www.youtube.com/watch?v=AtnjXAqZzYs',
  'https://www.youtube.com/watch?v=<div class="col-12 col-md-8 mx-auto youtube-item">            <div class="position-relative border rounded-3 shadow-sm p-2 mb-3 bg-white">                <div class="ratio ratio-16x9 mb-2">                    <iframe src="https://www.youtube.com/embed/bhXpiSyMM4k" allowfullscreen></iframe>                </div>                <div class="d-flex justify-content-end gap-2">                    <button type="button" class="btn btn-sm btn-outline-secondary editBtn">                        Editar                    </button>                    <button type="button" class="btn btn-sm btn-outline-danger removeBtn">                        Eliminar                    </button>                </div>            </div>        </div>',
  'https://www.youtube.com/watch?v=<iframe width="560" height="315" src="https://www.youtube.com/embed/3XFo2gvar-s?si=MeUYW9a7Dr-u_hPG" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
];

urls.forEach(url => console.log(extractYoutubeVideoId(url)));
