import flask


app = flask.Flask(__name__)


@app.route("/")
def index():
    return flask.render_template("app.html", title="Home")


if __name__ == "__main__":
    app.run(debug=True)
