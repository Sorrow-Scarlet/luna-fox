import flask
import modules.util

app = flask.Flask(__name__)


@app.route("/")
def index():
    return flask.render_template("app.html", title="Luna Fox Index")


if __name__ == "__main__":
    util = modules.util.drawHelper(app)
    app.run(debug=True)
