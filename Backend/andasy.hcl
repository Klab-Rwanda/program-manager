# andasy.hcl app configuration file generated for backendklab on Friday, 08-Aug-25 10:04:03 EET
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "backendklab"

app {

  env = {}

  port = 3000

  compute {
    cpu      = 1
    memory   = 1024
    cpu_kind = "shared"
  }

  process {
    name = "backendklab"
  }

}
