app_name = "program-management"

app {
  env = {}
  port = 3000

  # Tell Andasy to run this container image (no remote build)
  image = "docker.io/bonaeineza31/program-management:latest"

  compute {
    cpu      = 1
    memory   = 1024
    cpu_kind = "shared"
  }

  process {
    name = "program-management"
  }
}
