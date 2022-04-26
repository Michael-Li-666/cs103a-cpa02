//require packages
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

//initialize
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://yuangli-admin:liyuang@612@cluster0.99v3n.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

//creating the mongoose schema
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

//setting up the default items
const item1 = new Item({
  name: "Welcome to your CheckList!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//creating the listSchema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//setting the root route and load items
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});

//set customList
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

//add item to list
app.post("/", function(req, res) {

      const itemName = req.body.newItem;
      const listName = req.body.list;

      const item = new Item({
        name: itemName
      });
      if (listName === "Today") {
        item.save();
        res.redirect("/")
        }
        else {
          List.findOne({
            name: listName
          }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
          });
        }
      });

    //delete item from list
    app.post("/delete", function(req, res) {
      const checkedItemId = req.body.checkbox;
      const listName = req.body.listName;

      if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
          if (!err) {
            console.log("Successfully deleted checked item.");
            res.redirect("/");
          }
        });
      } else {
        List.findOneAndUpdate({
          name: listName
        }, {
          $pull: {
            items: {
              _id: checkedItemId
            }
          }
        }, function(err, foundList) {
          if (!err) {
            res.redirect("/" + listName);
          }
        });
      }


    });

    //about page
    app.get("/about", function(req, res) {
      res.render("about");
    });

    //server
    app.listen(3000, function() {
      console.log("Server started on port 3000");
    });
