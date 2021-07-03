const mongoose = require("mongoose");
const Document = require("./Document");

mongoose.connect("mongodb://localhost/google_docs_clone", {
  userNewUrlParser: true,
  userUnifiedTopoloty: true,
  useFindAndModify: false,
  userCreateIndex: true
});

const io = require("socket.io")(3001, {
  cors: {
    origin: "*",
    methods: ["*"]
  }
});

io.on("connection", socket => {
  socket.on("get-document", async docId => {
    const document = await findOrCreateDocument(docId);
    socket.join(docId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", delta => {
      socket.broadcast.to(docId).emit("receive-changes", delta);
    });

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(docId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: "" });
}
