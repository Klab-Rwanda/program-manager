# andasy.hcl app configuration file generated for program-manager on Saturday, 09-Aug-25 21:22:23 EET
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "program-manager"

app {

  env = {}

  port = 3000

  compute {
    cpu      = 1
    memory   = 1024
    cpu_kind = "shared"
  }

  process {
    name = "program-manager"
  }

}
