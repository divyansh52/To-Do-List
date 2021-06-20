
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// connect the mongodb and create a new Database
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
});
mongoose.set('useFindAndModify', false);

// Create a schema
const itemSchema = {
  name: String
};

// Cretae another schema
const listSchema = {
  name: String,
  items: [itemSchema]
};

// Create a mongoose model based on this scehma
const Item = mongoose.model('item', itemSchema);
// Cretae another model
const List = mongoose.model('list', listSchema);

// Create 3 document
const item1 = new Item({
  name: "Hello, this is your TODO List"
});

const item2 = new Item({
  name: "Press + button to add new items"
});


const item3 = new Item({
  name: "Hit delete to delete an item"
});

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {

  // Find the database entries
  Item.find({}, function(err, foundItems) {

    // Only insert the elements first time
    if (foundItems.length === 0) {
      // Insert the defaultItems array in Database
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        items: foundItems
      });
    }
  });

});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){ // if the list we are querying is not present already
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else{
        // show an existsing lists
        res.render("list", {listTitle: foundList.name, items: foundList.items});
      }
    }
  });


})

app.post("/", function(req, res) {

  const item = req.body.newItem;
  const listName = req.body.list;

  const newInsert = new Item({ name: item });

  if(listName === "Today"){
    newInsert.save();
    res.redirect("/");
}else{
  List.findOne({name: listName}, function(err, foundList){
    foundList.items.push(newInsert);
    foundList.save();
    res.redirect("/" + listName);
  });
}


});

app.post("/delete", function(req, res){
  const deleteItemId = req.body.checkbox; // Get the id of checbox to be deleted using the name and value field in checkbox form
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(deleteItemId, function(err){
      if(!err){
        console.log("Successfully deleted the checked item");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: deleteItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});


app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
