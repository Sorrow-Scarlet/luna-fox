import flask
import json

app = flask.Flask(__name__)


@app.route("/")
def index():
    return flask.render_template("app.html", title="Luna Fox Index")


if __name__ == "__main__":
    app.run(debug=True)
