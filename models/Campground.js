var mongoose = require("mongoose");
var comment  = require('./comment');

var campSchema = new mongoose.Schema({
    name: String,
    image: String,
    desc: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'comment'
        }
    ]
}, {
    usePushEach: true
});

module.exports = mongoose.model("Campground", campSchema);
