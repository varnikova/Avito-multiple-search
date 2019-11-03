const { Component } = React;
const { render } = ReactDOM;

const initialState = {
  CountItems:0,
  Items:[]
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = initialState;
    this.RequestByName = this.RequestByName.bind(this);
  }
  RequestByName(){
    ajaxReq("/ResArr/", {"Name":document.getElementById("Request").value, //добавила кавычки в названии параметров
      "Restrict":document.getElementById("Restrict").value}, function(result){
      this.setState({Items: result});

    }.bind(this));
  }
  render() {
    return (<div>
          <p>ссылка<input type="text" id="Request"></input> <br/>
            условие<input type="text" id="Restrict"></input>
            <button onClick={this.RequestByName}>Запрос</button>
          </p>
          <SearchResult Results={this.state.Items}/>
        </div>
    );
  }
}

class SearchResult extends React.Component{
  constructor(props) {
    super(props);
  }

  render() {

    let FindResultsComponents = this.props.Results.map(function(item) {
      if (item)
      return ( <a href={item.link} >
            <div className="Block">
              <p className="Tittle"> {item.title}	</p>
              {item.img1 && <p className="img"><img src={item.img1} height="100px" width="100px" /></p>}
              {item.img2 && <p className="img"><img src={item.img2} height="100px" width="100px" /></p>}
              <div dangerouslySetInnerHTML={{
                __html: item.content
              }}/>
            </div>
          </a>
      );
    }.bind(this));
    return <div>{FindResultsComponents}</div>;

  }

};

ReactDOM.render(<App />, document.getElementById("root"));


function ajaxReq(url, data, callback){
  $.ajax({
    url: url,
    type: 'POST',
    contentType:'application/json',
    data: JSON.stringify(data),
    dataType:'json'
  }).done(callback);
}

