# andasy.hcl app configuration file generated for klabbackend on Tuesday, 05-Aug-25 22:15:18 EET
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "klabbackend"

app {

  env = {}

  port = 3000

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "klabbackend"
  }

}
