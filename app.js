const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//connecting to database
mongoose.connect("mongodb+srv://admin-bruno:admin123@cluster0.7sogf.mongodb.net/todoListDB?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  });
//creating schema
const itemsSchema = {
  name: String
};
//creating model
const Item = mongoose.model("Item", itemsSchema);

const startItem = new Item({
  name: "New List Created! (delete me)"
})

const welcomeItem = new Item({
  name: "Welcome!"
})

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find({}, function (error, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(welcomeItem, function (error) {
        if (error) {
          console.log(error);
        } else {
          console.log("Default items successfully inserted.");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (error, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (error) {
      if (error) {
        console.log(error);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (error, foundList) {
    if (!error) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: startItem
        });
        list.save();
        res.redirect("/" + customListName)
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    } else {
      console.log(error);
    }
  });

});


//setup port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started successfully");
});
