const express = require("express");
const app = express();
const { Todo,User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
var csrf = require("tiny-csrf");
const passport = require("passport")
const connectEnsureLogin = require("connect-ensure-login")
const session = require("express-session")
const cookieParser = require("cookie-parser");
const LocalStrategy = require("passport-local")
const bcrypt = require("bcrypt")
const saltRounds = 10

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("some secret string"));
app.use(csrf("secret key thirty two characters", ["POST", "PUT", "DELETE"]));
app.use(session({
  secret: "secret-key-1597534826",
  cookie: {
    maxAge: 24*60*60*1000
  }
}))

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (username,password, done) => {
  User.findOne({where: { email:username}})
  .then(async (user) => {
    const result = await bcrypt.compare(password, user.password)
    if(result){
      return done(null, user)
    }else{
      return done("Invalid Password")
    }
  }).catch((error) => {
    return (error)
  })
}))

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id)
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id)
  .then(user => {
    done(null, user)
  })
  .catch((error) => {
    done(error,null)
  })
  
})

app.set("view engine", "ejs");


app.get("/signup", async (request,response) => {
  response.render("signup",{
    title: "Signup", csrfToken : request.csrfToken()
  })
})

app.post("/users", async (request,response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds)
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
      })
      request.login(user, (error) => {
        if(error){
          console.error(error)
        }
      })
      response.redirect("/todos")
  } catch (error) {
    console.error(error)
  }
  
})

app.get("/login", async (request,response) => {
  response.render("login",{
    title: "Login",
    csrfToken: request.csrfToken(),
  });
})

app.post("/session", passport.authenticate('local',{ failureRedirect: "/login"} ), (request,response) => {
  response.redirect("/todos")
})

app.get("/signout",(request,response,next)=>{
  request.logout((err) => {
    if(err) {return next(err)}
    response.redirect("/")
  })
})

app.use(express.static(path.join(__dirname, "public")));

app.post("/todos",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("creating a new Todo");
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    return response.redirect("/");
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.get("/", async (request, response) => {
    response.render("index", {
      title: "Todo application",
      csrfToken: request.csrfToken(),
    });
});

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const overdue = await Todo.overdue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();
  const completedItems = await Todo.completedTodos();
  if (request.accepts("html")) {
    response.render("todos", {
      title: "Todo application",
      overdue,
      dueToday,
      dueLater,
      completedItems,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      overdue,
      dueToday,
      dueLater,
      completedItems,
    });
  }
});

app.put("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("We have to update a todo with ID:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("Delete a todo by ID:", request.params.id);
  try {
    const deletedTodo = await Todo.remove(request.params.id);
    return response.send(deletedTodo ? true : false);
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
