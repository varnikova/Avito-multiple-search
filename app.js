var express = require("express");
var app = express();
var bodyParser = require("body-parser");
app.use(express.static("public"));
app.set("port", process.env.PORT || 80);
var jsonfile = require("jsonfile");
app.use(bodyParser.json());
var tunnel = require("tunnel");
var request = require("request"),
  cheerio = require("cheerio"),
  fs = require("fs"),
  path = require("path"),
  res_arr = [],
  ind = 0,
  count_posts = 1;
let random = null;
min = 1000; //в продакшн 5000
max = 6000; //не меньше 50000
var proxyArr = [];
let server = app.listen(app.get("port"), function () {
  //identification
  console.log(
    "Сервер запущен на  http://localhost:" +
      app.get("port") +
      "  Ctrl-C to terminate"
  );
  let filename = "proxyList.txt";
  fs.readFile(filename, "utf8", function (err, data) {
    if (err) throw err;
    console.log("OK: " + filename);
    proxyArr = data.split("\n");
  });
});
app.post("/ResArr/", function (req, res) {
  // news_base_url=req.body.Name;
  let news_base_url = req.body.Name + "&view=gallery"; //учесть что вид бывает галерея и нет
  let restricts = req.body.Restrict.split("%");
  let badrestricts = req.body.BadRestrict.split("%");
  let suited = false;
  console.log(news_base_url);
  //let short_url = news_base_url.replace('https://www.avito.ru', '');
  let options = {
    // agent: tunnel.httpsOverHttp({
    //   proxy: {
    //     host: "180.210.201.54",
    //     port: 3128,
    //     headers: "add's headers for request",
    //   },
    // }),

    url: news_base_url,
  };
  console.log(options);
  get_page_content(options, restricts, badrestricts);
});

function get_page_content(options, restricts, badrestricts) {
  request(options, function (error, response, body) {
    if (error) console.log(error);
    if (!error) {
      var $ = cheerio.load(body), //скаченый боди
        newses = $(".item");
      if (newses.length == 0) {
        console.log("Ничего не найдено либо выдали бан");
      }
      let itemsProcessed = 0;
      newses.each(function () {
        //по каждому идему
        var self = $(this);
        itemsProcessed++;
        self.find(".description").each(function () {
          //цикл по всем превью объявлений на странице
          title = $(this)
            .find(".snippet-link")[0]
            .children[0].data.toLowerCase(); //название текущего объявление
          if (
            !badrestricts.some(function (br) {
              //если минус-слов нет в названии
              return title.indexOf(br.toLowerCase()) >= 0; //если найдено минус слово возвращает истину
            })
          ) {
            let link = "https://www.avito.ru" + $(this).find("a").attr("href"); //ищем ссылку на текующее обьявление
            get_post_content(link).then((post) => {
              post.title = title.replace("undefined", "");
              post.price = $(this).find(".snippet-price")[0].children[0].data;
              post.img1 = self.find("img").attr("src");
              post.img2 = self.find("img").attr("data-srcpath");

              if (
                !badrestricts.some(function (br) {
                  //если минус-слов нет в описании
                  return post.content.indexOf(br.toLowerCase()) >= 0; //если найдено минус-слово возвращает истину
                })
              ) {
                if (
                  restricts.some(function (r) {
                    //если плюс-слово найдено
                    return title.indexOf(r.toLowerCase()) >= 0; //если найдено плюс-слово возвращает истину
                  })
                ) {
                  res_arr.push(post);
                } //добавляем в итоговый массив
                {
                  if (
                    restricts.some(function (r) {
                      //если плюс-слов есть в описании
                      return post.content.indexOf(r.toLowerCase()) >= 0; //если найдено плюс-слово возвращает истину
                    })
                  ) {
                    res_arr.push(post); //добавляем в итоговый массив
                  }
                }
              }
            });
          }
        });
        console.log(itemsProcessed + " " + newses.length);
        if (itemsProcessed === newses.length) {
          console.log(res_arr.length);
          res.send(res_arr);
        }
      });
    }
  });
}

function resolveAfterGetpage(link) {
  return new Promise((resolve) => {
    let post = {};
    request(link, function (error, response, body) {
      //запрос на страницу товара
      if (!error) {
        var $ = cheerio.load(body, {
          //парсим без декода
          decodeEntities: false,
        });

        //console.log($('.item-description').html())
        post.content = $(".item-description").html(); //item-address__string
        post.adress = $(".item-address__string").text();
      } else {
        console.log("Произошла ошибка: " + error);
      }
    });
  });
}
async function get_post_content(link) {
  const a = resolveAfterGetpage(link);
  return await a;
}
/*cont.find('span').each(function () {
                       if ($(this)[0].children[0])
                           if($(this)[0].children[0].data!=="В избранное" && $(this)[0].children[0].data!== '') { //находим название товара
                               //console.log($(this)[0].children[0].data);
                               // console.log("_______________________________")
                                   title+=$(this)[0].children[0].data;
                                   end=true;
                           }

                   });*/
//console.log("desc " + cont.find('.description')[0]);
