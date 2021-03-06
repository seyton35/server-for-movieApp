import Express from 'express'
import mysql from 'mysql'
import bodyParser from 'body-parser'
import bcrypt from "bcrypt";

const app = Express()

const date = new Date()

app.use(bodyParser.json({ type: 'application.json' }))
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = 3000

const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'movieApp'
})

const server = app.listen(PORT, () => {
  const host = server.address().address
  const port = server.address().port
})

con.connect(error => {
  if (error) console.log(error);
  else console.log('connected')
})

con.query("SET SESSION wait_timeout = 7200")//два часа работы

app.get('/', (req, res) => {
  con.query('SELECT * FROM users', (error, rows) => {
    if (error) console.log(error)

    else {
      res.send(rows)
    }
  })
})

app.get('/auto', (req, res) => {
  const { login, password } = req.query
  con.query(`SELECT * FROM users WHERE login = ${login}`, (error, row) => {
    if (error) console.log(error)
    else if (row.length != 0) {
      const { id, hash, salt } = row[0]
      const autoHash = bcrypt.hashSync(password, salt)
      if (autoHash == hash) {
        res.send({ status: true, id })
      }
      else res.send({ status: false })
    }
    else res.send({ status: false })
  })
})

app.get('/registration', (req, res) => {
  const regMail = /^([a-z0-9_\-]+\.)*[a-z0-9_\-]+@([a-z0-9][a-z0-9\-]*[a-z0-9]\.)+[a-z]{2,4}$/i
  const { login, mail, password } = req.query

  if (login.match(/\w\w\w\w/i)) {
    if (mail.match(regMail)) {
      if (password.match(/\w\w\w\w\w\w/i)) {

        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(password, salt)

        con.query(`SELECT id FROM users WHERE login = '${login}' OR  mail = '${mail}'`, (error, rows) => {
          if (error) console.log(error);
          else if (!rows.length) {
            con.query(`INSERT INTO users VALUES (NULL, '${login}','${mail}','${hash}', '${salt}')`, (error, row) => {
              if (error) console.log(error);
              else {
                con.query(`SELECT id FROM users WHERE login = '${login}'`, (error, row) => {
                  if (error) console.log(error);
                  else { res.send({ regStatus: true, id: row[0].id }) }
                })
              }
            })
          }
          else { res.send({ regStatus: false }) }
        })
      }
    }
    else {
    }
  }
})

app.get('/videoFromName', (req, res) => {
  let { videoName } = req.query
  if (videoName.length) {
    videoName = '%' + videoName + '%'
  }
  con.query(`SELECT * FROM video WHERE title LIKE '${videoName}'`, (err, rows) => {
    if (err) { console.log(err) }
    else {
      if (rows.length == 0) {
        console.log('no result')
      }
      else {
        res.send(rows)
      }
    }
  })
})

app.get('/allVideo', (req, res) => {
  con.query(`SELECT * FROM video`, (err, rows) => {
    if (err) { console.log(err) }
    else {
      res.send(rows)
    }
  })
})

app.get('/allHistoryVideo', (req, res) => {
  const idUser = req.query.idUser
  let videoList = new Array()
  con.query(`SELECT id_video FROM history WHERE id_user=${idUser}`, (error, rows) => {
    if (error) console.log(error)
    else {
      rows.map((item, index) => {
        const { id_video } = item
        con.query(`SELECT * FROM video WHERE id = ${id_video}`, (error, row) => {
          if (error) console.log(error)
          else {
            let { id, title, link, img } = row[0]
            videoList.push({ id, title, link, img })
          }
        })

      })
      setTimeout(() => {
        res.send(videoList)
      }, 100);
    }
  })
})

app.get('/toHistory', (req, res) => {
  const { userId, idVideo } = req.query
  con.query(`SELECT 1 FROM history WHERE id_video=${idVideo} AND id_user = ${userId}`, (err, rows) => {
    if (err) { console.log(err) }
    else if (rows.length == 0) {
      con.query(`INSERT INTO history VALUES(NULL, ${userId}, ${idVideo})`, (err, rows) => {
        if (err) { console.log(err) }
      })
    }
  })
})

app.get('/sendComment', (req, res) => {
  const { comment, userId, idVideo } = req.query
  const datetime = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()} ${date.getHours()}:${date.getMinutes()}`
  con.query(`INSERT INTO comment VALUES (NULL, '${datetime}','${userId}', '${idVideo}', '${comment}')`,(err,row)=>{
    if (err) {
      console.log(err);
    } else {
      res.send({leaved:true})
    }
  })
})

app.get('/getComments', (req,res)=>{
  const {videoId} = req.query
  con.query(`SELECT * FROM comment WHERE id_video = ${videoId}`, (err,rows)=>{
    if (err) {
      console.log(err);
    } else {
      res.send(rows)
    }
  })
})