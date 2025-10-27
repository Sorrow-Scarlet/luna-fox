import flask
import os

app = flask.Flask(__name__)

# 配置应用
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or "dev-secret-key"
app.config["TEMPLATES_AUTO_RELOAD"] = True


@app.route("/")
def index():
    return flask.render_template("app.html", title="Luna Fox Index")


if __name__ == "__main__":
    # 从环境变量获取端口和主机配置
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "127.0.0.1")

    # 仅在开发环境启用debug模式
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host=host, port=port, debug=debug)
